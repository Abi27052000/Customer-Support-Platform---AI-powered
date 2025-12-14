interface RowExpandPreviewProps {
  data: any;
}

const RowExpandPreview: React.FC<RowExpandPreviewProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mt-3">
      <h3 className="text-sm font-semibold mb-2 text-indigo-400">
        Selected Row Details
      </h3>

      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="text-xs text-slate-300">
          <span className="font-medium">{key}:</span> {String(value)}
        </div>
      ))}
    </div>
  );
};

export default RowExpandPreview;
