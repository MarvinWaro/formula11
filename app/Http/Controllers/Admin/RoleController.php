<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveRoleRequest;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    /**
     * Display the roles & permissions management page.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermission('roles.view'), 403);

        $roles = Role::query()
            ->withCount(['permissions', 'users'])
            ->with('permissions:id,name')
            ->orderBy('is_system', 'desc')
            ->orderBy('label')
            ->get()
            ->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'label' => $role->label,
                'description' => $role->description,
                'is_system' => $role->is_system,
                'permissions_count' => $role->permissions_count,
                'users_count' => $role->users_count,
                'permissions' => $role->permissions->pluck('name')->values(),
            ]);

        $permissions = Permission::query()
            ->orderBy('group')
            ->orderBy('label')
            ->get(['id', 'name', 'label', 'group', 'description'])
            ->groupBy('group')
            ->map(fn ($items, $group) => [
                'group' => $group,
                'permissions' => $items->map(fn (Permission $p) => [
                    'name' => $p->name,
                    'label' => $p->label,
                    'description' => $p->description,
                ])->values(),
            ])
            ->values();

        return Inertia::render('settings/roles/index', [
            'roles' => $roles,
            'permissionGroups' => $permissions,
            'permissions' => [
                'canCreate' => $request->user()->hasPermission('roles.create'),
                'canEdit' => $request->user()->hasPermission('roles.edit'),
                'canDelete' => $request->user()->hasPermission('roles.delete'),
            ],
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(SaveRoleRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $role = Role::create([
                'name' => $request->validated('name'),
                'label' => $request->validated('label'),
                'description' => $request->validated('description'),
                'is_system' => false,
            ]);

            $role->syncPermissions($request->validated('permissions', []));
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role created.')]);

        return to_route('admin.roles.index');
    }

    /**
     * Update the specified role.
     */
    public function update(SaveRoleRequest $request, Role $role): RedirectResponse
    {
        DB::transaction(function () use ($request, $role) {
            // System roles can be re-permissioned but not renamed.
            $payload = $role->is_system
                ? ['description' => $request->validated('description')]
                : [
                    'name' => $request->validated('name'),
                    'label' => $request->validated('label'),
                    'description' => $request->validated('description'),
                ];

            $role->update($payload);

            // Super admin always has every permission.
            if ($role->name === Role::SUPER_ADMIN) {
                $role->syncPermissions(Permission::query()->pluck('name')->all());

                return;
            }

            $role->syncPermissions($request->validated('permissions', []));
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role updated.')]);

        return to_route('admin.roles.index');
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Request $request, Role $role): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('roles.delete'), 403);
        abort_if($role->is_system, 403, 'System roles cannot be deleted.');

        $role->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role deleted.')]);

        return to_route('admin.roles.index');
    }
}
