# Saved cart integration checks

Start the C# backend locally with `dotnet run --project QyrusEcommerceCSharpBackend`.
Then run `dotnet run --project QyrusEcommerceCSharpBackend.Tests` from the repository root.
The dependency-free C# test executable uses localhost:9892 and creates unique test users.
Restart the backend to remove its in-memory test data.

The frontend defaults to http://localhost:9892. Set `VITE_API_BASE_URL` to your
C# service URL for a hosted build; Vite reads this setting at build time.

Saved items survive page refreshes, but reset when the backend restarts.
Moves and deletes return 404 when the source item is no longer present; retries
cannot duplicate quantities. Restoring merges matching product/color/size/provider
variants. Both save and restore responses include active and saved cart snapshots.
These routes follow the app's existing email-based user lookup; they do not add
authentication or make the supplied email a verified caller identity.

Manual UI checks:
- Select an item, save it, and confirm checkout selection and total exclude it.
- Refresh, restore it, and confirm it returns with its original options and quantity.
- Restore into a matching selected variant and confirm its quantity and total update.
- Remove saved items and verify both empty states.
- Simulate a failed request; existing items remain visible with an inline error.
- During a request, save, restore, remove, and checkout actions are disabled.
