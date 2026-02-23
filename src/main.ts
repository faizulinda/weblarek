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
import { Basket } from "./components/views/modals/Basket";
import { FormContacts } from "./components/views/modals/Forms/FormContacts";
import { FormOrder } from "./components/views/modals/Forms/FormOrder";
import { ModalContainer } from "./components/views/modals/ModalContainer";
import { OrderSuccess } from "./components/views/modals/OrderSuccess";
import "./scss/styles.scss";
import { IApi, IProduct } from "./types";
import { API_URL } from "./utils/constants";
import { ensureElement } from "./utils/utils";
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
  onClick: () => events.emit("basket:open"),
});
const modalEl = ensureElement<HTMLElement>(".modal", page);
const modal = new ModalContainer(modalEl, {
  onClick: () => events.emit("modal:close"),
});
let modalMode: "none" | "detail" | "basket" | "form_order" = "none";

const orderSuccess = new OrderSuccess(getTemplateRoot("success"), {
  onClick: () => events.emit("modal:close"),
});

const formOrder = new FormOrder(getTemplateRoot("order"), {
  onChooseCard: () => events.emit("payment:card"),
  onChooseCash: () => events.emit("payment:cash"),
  onAddressInput: (value: string) => {
    events.emit("customer:address", { address: value });
  },
  onClickFurther: () => events.emit("order:submit"),
});

const formContacts = new FormContacts(getTemplateRoot("contacts"), {
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
    await webLarekApi.postCustomer(customerData);
    submitRender();
    contentClear();
  } catch (error) {
    console.log(error);
  }
});

function contentClear() {
  cart.clearCart();
  customer.clear();
  header.counter = cart.getTotalCount();
}

function submitRender() {
  orderSuccess.successDescription = cart.getTotalPrice();
  modal.content = orderSuccess.render();
}

events.on("phone:changed", () => {
  formContacts.textError = customer.validation();
});

events.on("email:changed", () => {
  formContacts.textError = customer.validation();
});

events.on<{ email: string }>("contact:email", ({ email }) => {
  customer.setEmail(email);
});

events.on<{ phone: string }>("contact:phone", ({ phone }) => {
  customer.setPhone(phone);
});

events.on("order:submit", () => {
  formContactsRender();
});

function formContactsRender() {
  formContacts.email = customer.getData().email;
  formContacts.phone = customer.getData().phone;
  modal.content = formContacts.render();
}

events.on("address:changed", () => {
  formOrder.textError = customer.validation();
});

events.on<{ address: string }>("customer:address", ({ address }) => {
  customer.setAddress(address);
});

events.on("payment:changed", () => {
  formOrderRender();
});

events.on("payment:card", () => {
  customer.setPayment("card");
});

events.on("payment:cash", () => {
  customer.setPayment("cash");
});

//Подписка на событие order:place
//При нажатии на кнопку "Оформить" рендерится форма с адресом и способом оплаты и выводится в модальном окне
events.on("order:place", () => {
  modalMode = "form_order";
  formOrderRender();
});

function formOrderRender() {
  formOrder.payment = customer.getData().payment;
  formOrder.address = customer.getData().address;
  formOrder.textError = customer.validation();
  modal.content = formOrder.render();
}

//Подписка на событие basket:open
//При нажатии на иконку корзины рендерится корзина и отображается в модальном окне
events.on("basket:open", () => {
  modalMode = "basket";
  cartViewRender();
  modal.open();
});

//Подписка на событие cart:add
//При добавлении продукта в коризну, запускается добавление продукта в модель cart
events.on("cart:add", (product: IProduct) => {
  cart.addToCart(product);
});

//Подписка на событие cart:added
//При добавлении продукта в модель cart, запускается:
//- отрисовака детальной карточки продукта
//- перерасчет счетчика продуктов в корзине
events.on("cart:added", (product: IProduct) => {
  cardDetailViewRender(product);
  const counter = cart.getTotalCount();
  header.counter = counter;
});

//Подписка на событие cart:removed
//При удалении продукта из модели каталога,
//Пересобираем карточку продукта или коризны, в зависимости от того, где было инициировано удаление
events.on("cart:removed", (product: IProduct) => {
  header.counter = cart.getTotalCount();
  if (modalMode === "detail") {
    cardDetailViewRender(product);
    modal.close();
  }
  if (modalMode === "basket") {
    cartViewRender();
  }
});

//Подписка на событие cart:remove
//При нажатии на удаление продукта, запускается удаление продукта из каталога
events.on("cart:remove", (product: IProduct) => {
  cart.removeFromCart(product);
});

//Подписка на событие modal:close
//При нажатии на кнопку закрытия, модальное окно закрывается
events.on("modal:close", () => {
  modal.close();
  modalMode = "none";
});

//Подписка на событие card:selected
//При записи карточки в модели каталога отображается модальное окно с детальной карточкой
events.on("card:selected", (product: IProduct) => {
  cardDetailViewRender(product);
  modal.open();
});

//Подписка презентера на событие card:select.
//При клике на карточку продукта в каталоге сохраняем информацию о выбранном продукте в модели данных catalog
events.on("card:select", (product: IProduct) => {
  catalog.setSelectedProduct(product);
  modalMode = "detail";
});

// Подписка презентера на событие catalog:changed.
// При обновлении модели каталога пересобираем и рендерим карточки.
events.on("catalog:changed", () => {
  const itemCards = catalog.getProducts().map((product) => {
    const card = new CardCatalog(getTemplateRoot("card-catalog"), {
      onClick: () => events.emit("card:select", product),
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

//получить HTMLElement по названию template
function getTemplateRoot(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLTemplateElement)) {
    throw new Error(`${id} не <template>`);
  }
  const clone = el.content.cloneNode(true) as DocumentFragment;
  const root = clone.firstElementChild;
  if (!(root instanceof HTMLElement)) {
    throw new Error(`${id} не имеет корневого HTMLElement`);
  }

  return root;
}

//функция для рендера детальной карточки
function cardDetailViewRender(product: IProduct) {
  const inCart = cart.hasProduct(product.id);
  const card = new CardDetail(getTemplateRoot("card-preview"), {
    onClick: () => events.emit(inCart ? "cart:remove" : "cart:add", product),
  });
  card.buttonText = inCart ? "Удалить из корзины" : "Купить";
  card.buttonText = inCart
    ? "Удалить из корзины"
    : !(product.price === null)
      ? "Купить"
      : "Недоступно";
  const content = card.render(product);
  modal.content = content;
}

//функция для рендера корзины
function cartViewRender() {
  const basket = new Basket(getTemplateRoot("basket"), {
    onClick: () => events.emit("order:place"),
  });
  const itemCards: CardBasket[] = [];
  const itemCardsElements = cart.getCartProducts().map((product) => {
    const card = new CardBasket(getTemplateRoot("card-basket"), {
      onClick: () => events.emit("cart:remove", product),
    });
    itemCards.push(card);
    return card.render(product);
  });
  itemCards.forEach((item, index) => {
    item.itemIndex = index + 1;
  });
  basket.basketList = itemCardsElements;
  basket.basketPrice = cart.getTotalPrice();
  modal.content = basket.render();
}
