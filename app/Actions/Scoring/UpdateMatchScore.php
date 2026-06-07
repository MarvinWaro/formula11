<?php

namespace App\Actions\Scoring;

use App\Models\MatchGame;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateMatchScore
{
    /**
     * Persist an in-progress score update without finalizing the match. Used by
     * the umpire UI so that each tap of +/- is saved server-side.
     */
    public function live(MatchGame $match, int $scoreA, int $scoreB, User $umpire): MatchGame
    {
        $this->guardEditable($match);
        $this->guardScoreRange($scoreA, $scoreB);

        return DB::transaction(function () use ($match, $scoreA, $scoreB, $umpire) {
            $match->update([
                'score_a' => $scoreA,
                'score_b' => $scoreB,
                'winner_team_id' => null,
                'played_at' => null,
                'scored_by_user_id' => $umpire->id,
                'scored_at' => now(),
            ]);

            return $match->fresh();
        });
    }

    /**
     * Validate that the supplied score satisfies the category's win condition,
     * then lock the match by setting winner_team_id + played_at.
     */
    public function finalize(MatchGame $match, int $scoreA, int $scoreB, User $umpire): MatchGame
    {
        $this->guardEditable($match);
        $this->guardScoreRange($scoreA, $scoreB);

        $category = $match->category;
        $target = $this->targetForMatch($match);
        $winBy = $category->win_by_two ? 2 : 1;

        if ($scoreA === $scoreB) {
            throw ValidationException::withMessages([
                'score_a' => __('A match cannot end in a tie.'),
            ]);
        }

        $leader = max($scoreA, $scoreB);
        $trailer = min($scoreA, $scoreB);

        if ($leader < $target) {
            throw ValidationException::withMessages([
                'score_a' => __('Neither team has reached the target of :target points yet.', ['target' => $target]),
            ]);
        }

        if ($leader - $trailer < $winBy) {
            throw ValidationException::withMessages([
                'score_a' => __('The winner must lead by at least :margin point(s).', ['margin' => $winBy]),
            ]);
        }

        return DB::transaction(function () use ($match, $scoreA, $scoreB, $umpire) {
            $winnerId = $scoreA > $scoreB ? $match->team_a_id : $match->team_b_id;
            $loserId = $winnerId === $match->team_a_id ? $match->team_b_id : $match->team_a_id;

            $match->update([
                'score_a' => $scoreA,
                'score_b' => $scoreB,
                'winner_team_id' => $winnerId,
                'played_at' => now(),
                'scored_by_user_id' => $umpire->id,
                'scored_at' => now(),
            ]);

            // When a semifinal finalizes, push the winner into the Final slot
            // and the loser into the Bronze slot. SF1 fills the *_a slot,
            // SF2 fills the *_b slot.
            if ($match->stage === MatchGame::STAGE_SEMI) {
                $this->propagateSemiResult($match, $winnerId, $loserId);
            }

            return $match->fresh();
        });
    }

    /**
     * SF1 winner → Final.team_a, SF1 loser → Bronze.team_a.
     * SF2 winner → Final.team_b, SF2 loser → Bronze.team_b.
     */
    protected function propagateSemiResult(MatchGame $semi, string $winnerId, string $loserId): void
    {
        $final = MatchGame::query()
            ->where('tournament_category_id', $semi->tournament_category_id)
            ->where('stage', MatchGame::STAGE_FINAL)
            ->first();

        $bronze = MatchGame::query()
            ->where('tournament_category_id', $semi->tournament_category_id)
            ->where('stage', MatchGame::STAGE_BRONZE)
            ->first();

        $sideKey = $semi->sequence === 1 ? 'team_a_id' : 'team_b_id';

        if ($final !== null && ! $final->isFinalized()) {
            $final->update([$sideKey => $winnerId]);
        }

        if ($bronze !== null && ! $bronze->isFinalized()) {
            $bronze->update([$sideKey => $loserId]);
        }
    }

    /**
     * Target score: pool play uses rr_points_to_win; bracket stages use
     * elim_points_to_win. Falls back to rr target for safety.
     */
    public function targetForMatch(MatchGame $match): int
    {
        $category = $match->category;

        return $match->stage === MatchGame::STAGE_POOL
            ? (int) $category->rr_points_to_win
            : (int) $category->elim_points_to_win;
    }

    protected function guardEditable(MatchGame $match): void
    {
        if ($match->team_a_id === null || $match->team_b_id === null) {
            throw ValidationException::withMessages([
                'score_a' => __('Both teams must be assigned before a score can be recorded.'),
            ]);
        }

        if ($match->isFinalized()) {
            throw ValidationException::withMessages([
                'score_a' => __('This match is already finalized. Ask an admin to reset it before re-scoring.'),
            ]);
        }
    }

    protected function guardScoreRange(int $scoreA, int $scoreB): void
    {
        foreach (['score_a' => $scoreA, 'score_b' => $scoreB] as $field => $value) {
            if ($value < 0 || $value > 99) {
                throw ValidationException::withMessages([
                    $field => __('Score must be between 0 and 99.'),
                ]);
            }
        }
    }
}
