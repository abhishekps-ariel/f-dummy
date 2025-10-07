import { useNavigate } from "react-router-dom";

const PageNotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center mt-5">
            <h1 className="text-3xl font-bold text-red-600">404 - Page not found</h1>
            <p className="text-gray-600 mt-2">The page you are looking for doesn't exist or not available at the moment.</p>
            <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-500 text-secondary rounded-lg">Go Back</button>
        </div>
    );
};
export default PageNotFound;
