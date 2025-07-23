const PlaceholderComponent = () => {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
      <p className="text-gray-600 text-center">This is an interactive component.</p>
      <button 
        className="mt-2 w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => alert('Interactive component clicked!')}
      >
        Click me!
      </button>
    </div>
  );
};

export default PlaceholderComponent;