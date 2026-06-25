import { EmptyState, Table } from "@/components/ui";

export default function RecentRFPTable() {
  return (
    <div className="mt-8">

      <h2 className="mb-4 text-xl font-semibold">
        Recent RFPs
      </h2>

      <Table>

        <thead>

          <tr className="border-b">

            <th className="p-4 text-left">
              Customer
            </th>

            <th className="p-4 text-left">
              Status
            </th>

            <th className="p-4 text-left">
              Uploaded
            </th>

            <th className="p-4 text-left">
              Action
            </th>

          </tr>

        </thead>

        <tbody>

          <tr>

            <td
              colSpan={4}
              className="p-6"
            >
              <EmptyState
                message="No RFPs uploaded yet."
              />
            </td>

          </tr>

        </tbody>

      </Table>

    </div>
  );
}