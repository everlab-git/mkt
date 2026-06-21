import { beforeEach, describe, expect, it, vi } from "vitest";

const sendEmail = vi.fn().mockResolvedValue({ data: { id: "email_123" }, error: null });
const ResendMock = vi.fn(() => ({
  emails: {
    send: sendEmail
  }
}));

vi.mock("resend", () => ({
  Resend: ResendMock
}));

describe("sendLoginCodeEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  it("falha quando as variáveis do Resend não estão configuradas", async () => {
    const { sendLoginCodeEmail } = await import("./email");

    await expect(sendLoginCodeEmail("rick@example.com", "123456")).rejects.toThrow(
      "Resend env vars are required"
    );
    expect(ResendMock).not.toHaveBeenCalled();
  });

  it("envia o código de login usando o pacote resend", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM_EMAIL = "Freya <login@freya.test>";

    const { sendLoginCodeEmail } = await import("./email");

    await sendLoginCodeEmail("rick@example.com", "123456");

    expect(ResendMock).toHaveBeenCalledWith("re_test_key");
    expect(sendEmail).toHaveBeenCalledWith({
      from: "Freya <login@freya.test>",
      subject: "Seu código de acesso Freya",
      text: "Seu código de acesso é: 123456",
      to: "rick@example.com"
    });
  });
});
