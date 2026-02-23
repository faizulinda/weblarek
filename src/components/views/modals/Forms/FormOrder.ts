import { ensureElement } from "../../../../utils/utils";
import { Form, IForm, IOrderActions } from "./Form";
import { CustomerErrors } from "../../../models/customer";

interface IFormOrder extends IForm {
  payment: string | null;
  address: string | null;
}

export class FormOrder extends Form<IFormOrder> {
  protected addressInput: HTMLInputElement;
  protected cardButton: HTMLButtonElement;
  protected cashButton: HTMLButtonElement;

  constructor(container: HTMLElement, actions: IOrderActions) {
    super(container);

    this.addressInput = ensureElement<HTMLInputElement>(
      'input[name="address"]',
      this.container,
    );
    this.cardButton = ensureElement<HTMLButtonElement>(
      'button[name="card"]',
      this.container,
    );
    this.cashButton = ensureElement<HTMLButtonElement>(
      'button[name="cash"]',
      this.container,
    );

    if (actions.onChooseCard) {
      this.cardButton.addEventListener("click", actions.onChooseCard);
    }

    if (actions.onChooseCash) {
      this.cashButton.addEventListener("click", actions.onChooseCash);
    }

    if (actions.onAddressInput) {
      this.addressInput.addEventListener("input", (e) => {
        const value = (e.target as HTMLInputElement).value;
        actions.onAddressInput?.(value);
      });
    }
    const form = this.container as HTMLFormElement;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      actions.onClickFurther?.();
    });
  }

  set payment(value: string | null) {
    if (value === "card") {
      this.cardButton.classList.add("button_alt-active");
      this.cashButton.classList.remove("button_alt-active");
    }
    if (value === "cash") {
      this.cardButton.classList.remove("button_alt-active");
      this.cashButton.classList.add("button_alt-active");
    }

    if (value === "") {
      this.cardButton.classList.remove("button_alt-active");
      this.cashButton.classList.remove("button_alt-active");
    }
  }

  set address(value: string | null) {
    this.addressInput.value = value ?? "";
  }

  set textError(customerErrors: CustomerErrors) {
    this.submitButton.disabled = true;

    if (customerErrors.payment) {
      this.errorsElement.textContent = customerErrors.payment ?? "";
    } else {
      if (customerErrors.address) {
        this.errorsElement.textContent = customerErrors.address;
      } else {
        this.errorsElement.textContent = "";
        this.submitButton.disabled = false;
      }
    }
  }
}
