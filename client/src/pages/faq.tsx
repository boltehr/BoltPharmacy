import React from "react";
import { useTranslation } from "react-i18next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

export default function FAQPage() {
  const { t } = useTranslation();
  
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">{t("faq.title")}</h1>
        
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">{t("faq.about_section")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("faq.subtitle")}
            </p>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>{t("faq.questions.q1")}</AccordionTrigger>
                <AccordionContent>
                  {t("faq.questions.a1")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>{t("faq.questions.q2")}</AccordionTrigger>
                <AccordionContent>
                  {t("faq.questions.a2")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>{t("faq.questions.q3")}</AccordionTrigger>
                <AccordionContent>
                  {t("faq.questions.a3")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">{t("faq.prescriptions_section")}</h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-4">
                <AccordionTrigger>{t("faq.questions.q4")}</AccordionTrigger>
                <AccordionContent>
                  {t("faq.questions.a4")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger>{t("faq.questions.q5")}</AccordionTrigger>
                <AccordionContent>
                  {t("faq.questions.a5")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>{t("faq.questions.q6")}</AccordionTrigger>
                <AccordionContent>
                  {t("faq.questions.a6")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">{t("faq.insurance_section")}</h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-7">
                <AccordionTrigger>{t("faq.questions.q7")}</AccordionTrigger>
                <AccordionContent>
                  {t("faq.questions.a7")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-8">
                <AccordionTrigger>{t("faq.questions.q8")}</AccordionTrigger>
                <AccordionContent>
                  {t("faq.questions.a8")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9">
                <AccordionTrigger>{t("faq.questions.q9")}</AccordionTrigger>
                <AccordionContent>
                  {t("faq.questions.a9")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">{t("faq.account_section")}</h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-10">
                <AccordionTrigger>{t("faq.questions.q10")}</AccordionTrigger>
                <AccordionContent>
                  {t("faq.questions.a10")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-11">
                <AccordionTrigger>{t("faq.questions.q11")}</AccordionTrigger>
                <AccordionContent>
                  {t("faq.questions.a11")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-12">
                <AccordionTrigger>{t("faq.questions.q12")}</AccordionTrigger>
                <AccordionContent>
                  {t("faq.questions.a12")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <div className="text-center mt-12">
          <h3 className="text-xl font-medium mb-4">{t("faq.still_have_questions")}</h3>
          <p className="text-muted-foreground mb-6">
            {t("faq.support_text")}
          </p>
          <div className="flex justify-center gap-4">
            <a href="mailto:support@boltehr-pharmacy.com" className="text-primary hover:underline">
              {t("faq.email_support")}
            </a>
            <span className="text-muted-foreground">•</span>
            <a href="tel:+18005551234" className="text-primary hover:underline">
              {t("faq.call_support")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}