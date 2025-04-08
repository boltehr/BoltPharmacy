import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 text-center">
      <h1 className="text-9xl font-extrabold text-primary/20">404</h1>
      <h2 className="mt-8 text-3xl font-bold tracking-tight">
        {t("errors.notFound")}
      </h2>
      <p className="mt-4 text-lg text-muted-foreground max-w-md">
        {t("errors.pageNotFound")}
      </p>
      <div className="mt-10">
        <Button asChild>
          <Link href="/">
            <a>{t("common.backToHome")}</a>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;