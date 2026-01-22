import { Cart } from "./components/models/cart";
import { Catalog } from "./components/models/catalog";
import { Customer } from "./components/models/customer";
import { WebLarekApi } from "./components/services/weblarek-api";
import "./scss/styles.scss";
import { TGetProducts } from "./types";
import { apiProducts } from "./utils/data";

//Проверки
let catalog = new Catalog();
catalog.setProducts(apiProducts.items);
console.log("Массив товаров из каталога: ", catalog.getProducts());
const product = catalog.getProductById("854cef69-976d-4c2a-a18c-2aa45046c390");
if (product) {
  catalog.setSelectedProduct(product);
} else {
  console.log("Товар не найден");
}
console.log("Сохраненный продукт по ID ", catalog.getSelectedProduct());

const cart = new Cart();
console.log(
  "Пустая корзина, продукты: ",
  cart.getCartProducts(),
  " количество продуктов: ",
  cart.getTotalCount(),
  " полная стоимость: ",
  cart.getTotalPrice(),
);

catalog.getProducts().forEach((product, index) => {
  cart.addToCart(product);
  console.log(
    "корзина после добавления продукта ",
    index + 1,
    " состав корзины: ",
    cart.getCartProducts(),
    " стоимость корзины: ",
    cart.getTotalCount(),
  );
});
if (product) {
  cart.removeFromCart(product);
  console.log("корзина после удаления продукта: ", cart.getCartProducts());
} else {
  console.log("Товар не найден");
}

cart.clearCart();
console.log("корзина после очистки", cart.getCartProducts());

let customer = new Customer();
console.log(
  "Клиент с незаполненными параметрами: способ облаты: ",
  customer.getData().payment,
  " адрес: ",
  customer.getData().address,
  " email: ",
  customer.getData().email,
  " телефон: ",
  customer.getData().phone,
);
console.log("Валидация: ", customer.validation());
customer.setPayment("cash");
console.log(
  "Клиент после добавления способа оплаты: способ облаты: ",
  customer.getData().payment,
  " адрес: ",
  customer.getData().address,
  " email: ",
  customer.getData().email,
  " телефон: ",
  customer.getData().phone,
);
console.log("Валидация: ", customer.validation());
customer.setAddress("myAddress");
console.log(
  "Клиент после добавления адреса: способ облаты: ",
  customer.getData().payment,
  " адрес: ",
  customer.getData().address,
  " email: ",
  customer.getData().email,
  " телефон: ",
  customer.getData().phone,
);
console.log("Валидация: ", customer.validation());
customer.setEmail("myemail@mail.com");
console.log(
  "Клиент после добавления email: способ облаты: ",
  customer.getData().payment,
  " адрес: ",
  customer.getData().address,
  " email: ",
  customer.getData().email,
  " телефон: ",
  customer.getData().phone,
);
console.log("Валидация: ", customer.validation());
customer.setPhone("+333-33-33-33");
console.log(
  "Клиент после добавления телефона: способ облаты: ",
  customer.getData().payment,
  " адрес: ",
  customer.getData().address,
  " email: ",
  customer.getData().email,
  " телефон: ",
  customer.getData().phone,
);
console.log("Валидация: ", customer.validation());

const api = new WebLarekApi();
let products: TGetProducts;

try {
  products = await api.getProducts();
  catalog.setProducts(products.items);
  console.log("каталог продуктов принятых по API: ", catalog.getProducts());
} catch (error) {
  console.log(error);
}
