import { Form, Head } from '@inertiajs/react';
import { Trophy, Users } from 'lucide-react';
import { useState } from 'react';
import PartnerJoinController from '@/actions/App/Http/Controllers/Public/PartnerJoinController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PartnerJoinProps } from '@/types';

export default function PartnerJoin({ token, team, auth }: PartnerJoinProps) {
    const [passwordPrompt, setPasswordPrompt] = useState<
        null | 'create' | 'signin'
    >(null);

    const isLoggedIn = auth.user !== null;

    return (
        <div className="min-h-screen bg-muted/30">
            <Head title={`Join team – ${team.display_name}`} />

            <div className="mx-auto max-w-md px-4 py-8">
                <header className="mb-6 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Trophy className="h-4 w-4" />
                        Partner invite
                    </div>
                    <h1 className="text-2xl font-bold">{team.display_name}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary">{team.category_name}</Badge>
                    </div>
                </header>

                <div className="mb-4 flex items-start gap-3 rounded-lg border bg-background p-4">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">
                            {team.is_claim && team.placeholder_name
                                ? `${team.player1_name} signed you up as "${team.placeholder_name}"`
                                : `${team.player1_name} has invited you to join as Player 2`}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {team.is_claim
                                ? 'Link your account to this team so you can track your matches.'
                                : 'Fill in your details to complete the team registration.'}
                        </p>
                    </div>
                </div>

                <Form
                    {...PartnerJoinController.store.form(token)}
                    className="space-y-5 rounded-lg border bg-background p-5"
                    onError={(errors) => {
                        if (errors.needs_signin) {
                            setPasswordPrompt('signin');
                        } else if (errors.needs_password) {
                            setPasswordPrompt('create');
                        }
                    }}
                >
                    {({ errors, processing }) => (
                        <>
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Your details
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {isLoggedIn
                                        ? `Signed in as ${auth.user?.name}.`
                                        : passwordPrompt === 'signin'
                                          ? 'Welcome back! We found your account — enter your password to join this team.'
                                          : passwordPrompt === 'create'
                                            ? "One more step — create a password to track your team's matches."
                                            : 'Fill in your details to join the team.'}
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="partner-name">
                                    Your name *
                                </Label>
                                <Input
                                    id="partner-name"
                                    name="partner_name"
                                    required
                                    readOnly={isLoggedIn}
                                    defaultValue={
                                        auth.user?.name ??
                                        team.placeholder_name ??
                                        ''
                                    }
                                    placeholder="Maria Clara"
                                />
                                <InputError message={errors.partner_name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="partner-email">
                                    Your email *
                                </Label>
                                <Input
                                    id="partner-email"
                                    name="partner_email"
                                    type="email"
                                    required
                                    readOnly={isLoggedIn}
                                    defaultValue={auth.user?.email ?? ''}
                                    placeholder="maria@example.com"
                                />
                                <InputError message={errors.partner_email} />
                            </div>

                            {!isLoggedIn && passwordPrompt !== null && (
                                <div className="grid gap-2 rounded-md border border-primary/20 bg-primary/5 p-3">
                                    <Label htmlFor="partner-password">
                                        {passwordPrompt === 'signin'
                                            ? 'Your password *'
                                            : 'Create a password *'}
                                    </Label>
                                    <Input
                                        id="partner-password"
                                        name="partner_password"
                                        type="password"
                                        required
                                        minLength={
                                            passwordPrompt === 'signin'
                                                ? undefined
                                                : 8
                                        }
                                        placeholder={
                                            passwordPrompt === 'signin'
                                                ? 'Enter your existing password'
                                                : 'Min. 8 characters'
                                        }
                                        autoComplete={
                                            passwordPrompt === 'signin'
                                                ? 'current-password'
                                                : 'new-password'
                                        }
                                        autoFocus
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {passwordPrompt === 'signin'
                                            ? "We'll sign you in and add you to the team."
                                            : "You'll use this to log in and check your team's matches."}
                                    </p>
                                    <InputError
                                        message={errors.partner_password}
                                    />
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full"
                            >
                                Join team
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </div>
    );
}
