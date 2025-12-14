import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContactSection from "../contact";
import { beforeEach, afterEach, test, expect, vi } from "vitest"; // <-- import Vitest functions

beforeEach(() => {
  global.fetch = vi.fn(); // <-- use vi.fn() instead of jest.fn()
});

afterEach(() => {
  vi.resetAllMocks();
});

test("odeslání formuláře funguje správně", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    text: async () => "Zpráva odeslána!",
  });

  render(<ContactSection />);

  fireEvent.change(screen.getByPlaceholderText("Vaše jméno"), { target: { value: "Petr" } });
  fireEvent.change(screen.getByPlaceholderText("Název firmy"), { target: { value: "TestFirma" } });
  fireEvent.change(screen.getByPlaceholderText("Váš email"), { target: { value: "petr@test.cz" } });
  fireEvent.change(screen.getByPlaceholderText("Vaše zpráva"), { target: { value: "Testovací zpráva" } });

  fireEvent.click(screen.getByText("Odeslat"));

  await waitFor(() => {
    expect(screen.getByText("Zpráva odeslána!")).toBeInTheDocument();
  });
});

test("chyba při odeslání zobrazí status", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    text: async () => "Chyba serveru",
  });

  render(<ContactSection />);

  fireEvent.change(screen.getByPlaceholderText("Vaše jméno"), { target: { value: "Petr" } });
  fireEvent.change(screen.getByPlaceholderText("Název firmy"), { target: { value: "TestFirma" } });
  fireEvent.change(screen.getByPlaceholderText("Váš email"), { target: { value: "petr@test.cz" } });
  fireEvent.change(screen.getByPlaceholderText("Vaše zpráva"), { target: { value: "Testovací zpráva" } });

  fireEvent.click(screen.getByText("Odeslat"));

  await waitFor(() => {
    expect(screen.getByText(/Chyba/i)).toBeInTheDocument();
  });
});
