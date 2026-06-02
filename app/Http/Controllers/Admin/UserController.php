<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Teams\CreateTeam;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(private CreateTeam $createTeam) {}

    /**
     * Display a listing of users.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermission('users.view'), 403);

        $users = User::query()
            ->with('roles:id,name,label')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at?->toISOString(),
                'created_at' => $user->created_at->toISOString(),
                'roles' => $user->roles->map(fn (Role $role) => [
                    'name' => $role->name,
                    'label' => $role->label,
                ])->values(),
            ]);

        $roles = Role::query()
            ->orderBy('label')
            ->get(['id', 'name', 'label'])
            ->map(fn (Role $role) => [
                'name' => $role->name,
                'label' => $role->label,
            ]);

        return Inertia::render('settings/users/index', [
            'users' => $users,
            'availableRoles' => $roles,
            'permissions' => [
                'canCreate' => $request->user()->hasPermission('users.create'),
                'canEdit' => $request->user()->hasPermission('users.edit'),
                'canDelete' => $request->user()->hasPermission('users.delete'),
            ],
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->validated('name'),
                'email' => $request->validated('email'),
                'password' => Hash::make($request->validated('password')),
                'email_verified_at' => now(),
            ]);

            $this->createTeam->handle($user, $user->name."'s Team", isPersonal: true);
            $user->syncRoles($request->validated('roles', []));
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User created.')]);

        return to_route('admin.users.index');
    }

    /**
     * Update the specified user.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        DB::transaction(function () use ($request, $user) {
            $user->update([
                'name' => $request->validated('name'),
                'email' => $request->validated('email'),
                ...($request->filled('password')
                    ? ['password' => Hash::make($request->validated('password'))]
                    : []),
            ]);

            $user->syncRoles($request->validated('roles', []));
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User updated.')]);

        return to_route('admin.users.index');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('users.delete'), 403);
        abort_if($user->id === $request->user()->id, 403, 'You cannot delete your own account here.');
        abort_if($user->hasRole(Role::SUPER_ADMIN), 403, 'Super admins cannot be deleted from this screen.');

        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User deleted.')]);

        return to_route('admin.users.index');
    }
}
