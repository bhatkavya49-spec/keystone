import EmptyState from "./EmptyState";

export default function DataTable({
  columns,
  rows,
  keyField = "id",
  onRowClick,
  emptyMessage,
  loading,
}) {
  if (loading) {
    return null;
  }

  if (!rows || rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[keyField]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "table__row--clickable" : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} data-label={column.header}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}