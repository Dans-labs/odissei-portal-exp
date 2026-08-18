export default function Error({ message }: { message: string }) {
  return (
    <div className="text-center py-20 bg-gray-100 dark:bg-gray-900">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-lg mb-0">{message}</p>
    </div>
  );
}
