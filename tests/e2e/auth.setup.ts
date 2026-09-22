import { test as setup } from "@playwright/test";
import { ADMIN_EMAIL, STATE, STUDENT1, STUDENT2 } from "./env";
import { loginViaUI } from "./helpers";

// Una sesión por rol, reutilizable por el resto de la suite (storageState).
const accounts = [
  { name: "admin", email: ADMIN_EMAIL, file: STATE.admin, landing: /\/admin$/ },
  { name: "student1", email: STUDENT1.email, file: STATE.student, landing: /\/student$/ },
  { name: "student2", email: STUDENT2.email, file: STATE.student2, landing: /\/student$/ },
];

for (const account of accounts) {
  setup(`sesión de ${account.name}`, async ({ page }) => {
    await loginViaUI(page, account.email);
    await page.waitForURL(account.landing);
    await page.context().storageState({ path: account.file });
  });
}
