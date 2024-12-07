import CircularProgress from '@mui/material/CircularProgress';

export const LoadingSpinner = () => {
  return (
    <div className="absolute inset-0 flex justify-center items-center bg-gray-200 bg-opacity-50 z-10">
      <CircularProgress size={150} />
    </div>
  );
};

