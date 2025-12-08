import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropTypes from 'prop-types';

const PageNotFound = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center mt-5">
            <h1 className="text-3xl font-bold text-red-600">{t("pageNotFound.title")}</h1>
            <p className="text-gray-600 mt-2">{t("pageNotFound.description")}</p>
            <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-500 text-secondary rounded-lg">{t("pageNotFound.goBack")}</button>
        </div>
    );
};
export default PageNotFound;
