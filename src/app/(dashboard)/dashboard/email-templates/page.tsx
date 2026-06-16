import { Mail, Plus, Save } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEmailTemplateAction, updateEmailTemplateAction } from "@/lib/actions/email-templates";
import { requireUserManagementAccess } from "@/lib/auth";
import { getEmailTemplates } from "@/lib/data";
import { EMAIL_TEMPLATE_TOKENS } from "@/lib/email/templates";

export default async function EmailTemplatesPage() {
  const access = await requireUserManagementAccess();
  const templates = await getEmailTemplates(access.organizationId);

  async function createTemplate(formData: FormData) {
    "use server";
    await createEmailTemplateAction(formData);
  }

  async function updateTemplate(formData: FormData) {
    "use server";
    await updateEmailTemplateAction(formData);
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Email Templates"
        description="Manage the reusable email copy for registrations, reminders, payment follow-up, and event notices."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_0.42fr]">
        <div className="space-y-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <p className="mt-1 text-sm text-[#999999]">Updated {formatDate(template.updated_at)}</p>
                  </div>
                  <Badge>
                    <Mail className="mr-1 h-3 w-3" aria-hidden />
                    Email
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <form action={updateTemplate} className="space-y-4">
                  <input type="hidden" name="id" value={template.id} />
                  <input type="hidden" name="organizationId" value={template.organization_id} />
                  <Field label="Template name">
                    <Input name="name" defaultValue={template.name} required />
                  </Field>
                  <Field label="Subject">
                    <Input name="subject" defaultValue={template.subject} required />
                  </Field>
                  <Field label="Body">
                    <Textarea name="body" defaultValue={template.body} className="min-h-64 font-mono text-xs leading-5" required />
                  </Field>
                  <Button type="submit" variant="outline">
                    <Save className="h-4 w-4" aria-hidden />
                    Save Template
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Template</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createTemplate} className="space-y-4">
                <input type="hidden" name="organizationId" value={access.organizationId} />
                <Field label="Template name">
                  <Input name="name" placeholder="Speaker follow-up" required />
                </Field>
                <Field label="Subject">
                  <Input name="subject" placeholder="Thanks for attending {{event}}" required />
                </Field>
                <Field label="Body">
                  <Textarea
                    name="body"
                    placeholder={"Hi {{first_name}},\n\nThanks for joining {{event}}."}
                    className="min-h-44 font-mono text-xs leading-5"
                    required
                  />
                </Field>
                <Button type="submit">
                  <Plus className="h-4 w-4" aria-hidden />
                  Create Template
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Template Variables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {EMAIL_TEMPLATE_TOKENS.map((item) => (
                <div key={item.token} className="flex items-center justify-between gap-3 rounded-md border border-white/10 px-3 py-2">
                  <span className="font-mono text-xs text-white">{item.token}</span>
                  <span className="text-right text-xs text-[#999999]">{item.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
