import { IActions } from "../../../types";
import { CardWithImage, ICardWhithImage } from "./CardWithImage";

export class CardCatalog extends CardWithImage<ICardWhithImage> {
  constructor(container: HTMLElement, actions?: IActions) {
    super(container);

    if (actions?.onClick) {
      this.container.addEventListener("click", actions.onClick);
    }
  }
}
