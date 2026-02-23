import { ensureElement } from "../../../../utils/utils";
import { Component } from "../../../base/Component";
import { CustomerErrors } from "../../../models/customer";

export interface IOrderActions {
  onChooseCard?: () => void;
  onChooseCash?: () => void;
  onAddressInput?: (value: string) => void;
  onClickFurther?: () => void;
  onEmailInput?: (value: string) => void;
  onPhoneInput?: (value: string) => void;
  onClickPay?: () => void;
}

export interface IForm {
  textError: CustomerErrors;
}

export abstract class Form<IForm> extends Component<IForm> {
  protected submitButton: HTMLButtonElement;
  protected errorsElement: HTMLElement;

  constructor(container: HTMLElement) {
    super(container);

    this.submitButton = ensureElement<HTMLButtonElement>(
      'button[type="submit"]',
      this.container,
    );
    this.errorsElement = ensureElement<HTMLElement>(
      ".form__errors",
      this.container,
    );
  }
}
