import { createFileRoute, redirect } from "@tanstack/react-router";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaintBrush } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/users")({
  component: UsersPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

function UsersPage() {
  const usersQuery = useQuery(trpc.getUsers.queryOptions());
  const navigate = useNavigate({
		from: "/",
	});
  return (
    <div className="mx-auto max-w-md w-full px-3 py-4 border border-white">
      <h1 className="mb-4 text-lg font-semibold">User List</h1>

      {usersQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Loading users...</p>
      )}

      {usersQuery.error && (
        <p className="text-sm text-red-500">
          Failed to load users: {usersQuery.error.message}
        </p>
      )}

      {usersQuery.data && (
        <div className="divide-y divide-border rounded-lg border">
          {(usersQuery.data as any).map((user: any) => (
            <div
            onClick={() =>
              navigate({
                to: "/pdfdesigner/$id",
                params: { id: String(user.id) },
              })
            }
            key={user.id} className="p-3 text-sm flex flex-row justify-between items-center">
              <div className="flex flex-col">
                <p className="font-medium">{user.name || "No Name"}</p>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              <FontAwesomeIcon icon={faPaintBrush} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
