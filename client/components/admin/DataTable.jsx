export default function DataTable({ columns, data, onRowClick }) {
  return (
    <div className="bg-[#1E1E1E] rounded-lg border border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#252525] border-b border-gray-800">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr
                  key={row._id || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-gray-800 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${
                    rowIndex % 2 === 0 ? 'bg-[#1E1E1E]' : 'bg-[#252525]'
                  } hover:bg-[#4CAF50]/10`}
                >
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 text-sm text-gray-300">
                      {column.render ? column.render(row) : row[column.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-gray-500">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}