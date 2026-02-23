import { ensureElement } from "../../../../utils/utils";
import { CustomerErrors } from "../../../models/customer";
import { Form, IForm, IOrderActions } from "./Form";

interface IFormContacts extends IForm {
  email: string;
  phone: string;
}

export class FormContacts extends Form<IFormContacts> {
  protected emailInput: HTMLInputElement;
  protected phoneInput: HTMLInputElement;

  constructor(container: HTMLElement, actions: IOrderActions) {
    super(container);

    this.emailInput = ensureElement<HTMLInputElement>(
      'input[name="email"]',
      this.container,
    );
    this.phoneInput = ensureElement<HTMLInputElement>(
      'input[name="phone"]',
      this.container,
    );

    if (actions.onEmailInput) {
      this.emailInput.addEventListener("input", (e) => {
        const value = (e.target as HTMLInputElement).value;
        actions.onEmailInput?.(value);
      });
    }

    if (actions.onPhoneInput) {
      this.phoneInput.addEventListener("input", (e) => {
        const value = (e.target as HTMLInputElement).value;
        actions.onPhoneInput?.(value);
      });
    }

    const form = this.container as HTMLFormElement;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      actions.onClickPay?.();
    });
  }

  set email(value: string | null) {
    this.emailInput.value = value ?? "";
  }

  set phone(value: string | null) {
    this.phoneInput.value = value ?? "";
  }

  set textError(customerErrors: CustomerErrors) {
    this.submitButton.disabled = true;

    if (customerErrors.email) {
      this.errorsElement.textContent = customerErrors.email;
    } else {
      if (customerErrors.phone) {
        this.errorsElement.textContent = customerErrors.phone;
      } else {
        this.errorsElement.textContent = "";
        this.submitButton.disabled = false;
      }
    }
  }
}
