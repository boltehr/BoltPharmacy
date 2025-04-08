import { Helmet } from "react-helmet-async";
import { useWhiteLabel } from "@/lib/context/whiteLabel";

const WhiteLabelHead = () => {
  const { config } = useWhiteLabel();

  return (
    <Helmet>
      <title>{config?.name || "BoltEHR Pharmacy"}</title>
      <meta
        name="description"
        content={
          config?.tagline ||
          "Your trusted online pharmacy for affordable medications"
        }
      />
      {config?.primaryColor && (
        <style>
          {`
            :root {
              --primary: ${config.primaryColor};
              --primary-foreground: #ffffff;
            }
          `}
        </style>
      )}
      {config?.theme?.fontFamily && (
        <style>
          {`
            body {
              font-family: ${config.theme.fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            }
          `}
        </style>
      )}
    </Helmet>
  );
};

export default WhiteLabelHead;