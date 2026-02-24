import { Api } from "./components/base/Api";
import { EventEmitter } from "./components/base/Events";
import { Cart } from "./components/models/cart";
import { Catalog } from "./components/models/catalog";
import { Customer } from "./components/models/customer";
import { WebLarekApi } from "./components/services/weblarek-api";
import { CardBasket } from "./components/views/cards/CardBasket";
import { CardCatalog } from "./components/views/cards/CardCatalog";
import { CardDetail } from "./components/views/cards/CardDetail";
import { Gallery } from "./components/views/Gallery";
import { Header } from "./components/views/Header";
import { Basket } from "./components/views/Basket";
import { FormContacts } from "./components/views/Forms/FormContacts";
import { FormOrder } from "./components/views/Forms/FormOrder";
import { ModalContainer } from "./components/views/modals/ModalContainer";
import { OrderSuccess } from "./components/views/OrderSuccess";
import "./scss/styles.scss";
import { IApi, IProduct, TPostCustomer } from "./types";
import { API_URL } from "./utils/constants";
import { cloneTemplate, ensureElement } from "./utils/utils";
import { TCustomerApi } from "./types";

const API_ORIGIN: string = API_URL;
const api: IApi = new Api(API_ORIGIN);
const webLarekApi = new WebLarekApi(api);

const events = new EventEmitter();
const catalog = new Catalog(events);
const cart = new Cart(events);
const customer = new Customer(events);

const page = document.body;
const gallery = new Gallery(events, page);
const headerEl = document.querySelector(".header") as HTMLElement;

const header = new Header(headerEl, {
  onClick: () => events.emit("header-basket:click"),
});

const basket = new Basket(cloneTemplate("#basket"), {
  onClick: () => events.emit("basket-button:click"),
});

const cardDetail = new CardDetail(cloneTemplate("#card-preview"), {
  onClick: () => events.emit("card-detail:click"),
});

const modalEl = ensureElement<HTMLElement>(".modal", page);
const modal = new ModalContainer(modalEl, {
  onClick: () => events.emit("modal:close"),
});

const orderSuccess = new OrderSuccess(cloneTemplate("#success"), {
  onClick: () => events.emit("modal:close"),
});

const formOrder = new FormOrder(cloneTemplate("#order"), {
  onChooseCard: () => events.emit("payment:card"),
  onChooseCash: () => events.emit("payment:cash"),
  onAddressInput: (value: string) => {
    events.emit("customer-address:input", { address: value });
  },
  onClickFurther: () => events.emit("form-order-button:click"),
});

const formContacts = new FormContacts(cloneTemplate("#contacts"), {
  onEmailInput: (value: string) => {
    events.emit("contact:email", { email: value });
  },
  onPhoneInput: (value: string) => {
    events.emit("contact:phone", { phone: value });
  },
  onClickPay: () => events.emit("order:pay"),
});

events.on("order:pay", async () => {
  const data = customer.getData();
  const customerData: TCustomerApi = {
    email: data.email ?? "",
    address: data.address ?? "",
    phone: data.phone ?? "",
    payment: data.payment,
    total: cart.getTotalPrice(),
    items: cart.getCartProducts().map((item) => {
      return item.id;
    }),
  };
  try {
    const result: TPostCustomer = await webLarekApi.postCustomer(customerData);
    submitRender(result);
    contentClear();
    modal.content = orderSuccess.render();
  } catch (error) {
    console.log(error);
  }
});

events.on("customer:changed", () => {
  formOrderRender();
  formContactsRender();
});

events.on<{ email: string }>("contact:email", ({ email }) => {
  customer.setEmail(email);
});

events.on<{ phone: string }>("contact:phone", ({ phone }) => {
  customer.setPhone(phone);
});

events.on("form-order-button:click", () => {
  formContactsRender();
  modal.content = formContacts.render();
});

events.on<{ address: string }>("customer-address:input", ({ address }) => {
  customer.setAddress(address);
});

events.on("payment:card", () => {
  customer.setPayment("card");
});

events.on("payment:cash", () => {
  customer.setPayment("cash");
});

events.on("basket-button:click", () => {
  formOrderRender();
  modal.content = formOrder.render();
});

events.on("header-basket:click", () => {
  modal.content = basket.render();
  modal.open();
});

events.on("cart:changed", () => {
  cartViewRender();
  cardDetailViewRender();
  header.counter = cart.getTotalCount();
});

events.on("modal:close", () => {
  modal.close();
});

events.on("card-basket:click", (product: IProduct) => {
  cart.removeFromCart(product);
});

events.on("card-detail:click", () => {
  const selectedProduct = catalog.getSelectedProduct();
  if (selectedProduct) {
    const inCart = cart.hasProduct(selectedProduct.id);
    inCart
      ? cart.removeFromCart(selectedProduct)
      : cart.addToCart(selectedProduct);
    cardDetailViewRender();
    modal.content = cardDetail.render();
  }
});

events.on("card-catalog:click", (product: IProduct) => {
  catalog.setSelectedProduct(product);
  modal.content = cardDetail.render();
  modal.open();
});

events.on("card:selected", () => {
  cardDetailViewRender();
});

events.on("catalog:changed", () => {
  const itemCards = catalog.getProducts().map((product) => {
    const card = new CardCatalog(cloneTemplate("#card-catalog"), {
      onClick: () => events.emit("card-catalog:click", product),
    });
    return card.render(product);
  });

  gallery.render({ catalog: itemCards });
});

//обращаемся по Api, получем список продуктов и записываем их в catalog
try {
  const products = await webLarekApi.getProducts();
  catalog.setProducts(products.items);
} catch (error) {
  console.log(error);
}

//функция для рендера детальной карточки
function cardDetailViewRender() {
  const selectedProduct = catalog.getSelectedProduct();
  let inCart: boolean;
  if (selectedProduct) {
    inCart = cart.hasProduct(selectedProduct.id);
    cardDetail.buttonText = inCart
      ? "Удалить из корзины"
      : !(selectedProduct.price === null)
        ? "Купить"
        : "Недоступно";
    cardDetail.render(selectedProduct);
  }
}

//функция для рендера корзины
function cartViewRender() {
  const itemCards: CardBasket[] = [];
  const itemCardsElements = cart.getCartProducts().map((product) => {
    const card = new CardBasket(cloneTemplate("#card-basket"), {
      onClick: () => events.emit("card-basket:click", product),
    });
    itemCards.push(card);
    return card.render(product);
  });
  itemCards.forEach((item, index) => {
    item.itemIndex = index + 1;
  });
  basket.basketList = itemCardsElements;
  modal.content = basket.render();
  basket.basketPrice = cart.getTotalPrice();
}

function formOrderRender() {
  const errors = customer.validation();
  formOrder.payment = customer.getData().payment;
  formOrder.address = customer.getData().address;
  formOrder.isValid = !errors.payment && !errors.address;
  formOrder.textError = errors.payment ?? errors.address ?? "";
}

function formContactsRender() {
  const errors = customer.validation();
  formContacts.phone = customer.getData().phone;
  formContacts.email = customer.getData().email;
  formContacts.isValid = !errors.phone && !errors.email;
  formContacts.textError = errors.email ?? errors.phone ?? "";
}

function contentClear() {
  cart.clearCart();
  customer.clear();
}

function submitRender(result: TPostCustomer) {
  if (result.total) {
    orderSuccess.successDescription = result.total;
  }
}
