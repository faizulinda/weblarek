import { ICustomer } from "../../types";
import { IEvents } from "../base/Events";

export class Customer {
  private payment: ICustomer["payment"] = "";
  private address: string | null = null;
  private email: string | null = null;
  private phone: string | null = null;

  constructor(private events: IEvents) {}

  setPayment(payment: ICustomer["payment"]): void {
    this.payment = payment;
    this.events.emit('customer:changed');
  }

  setAddress(address: string | null): void {
    this.address = address;
    this.events.emit('customer:changed');
  }

  setEmail(email: string | null): void {
    this.email = email;
    this.events.emit('customer:changed');
  }

  setPhone(phone: string | null): void {
    this.phone = phone;
    this.events.emit('customer:changed');
  }

  getData(): ICustomer {
    return {
      payment: this.payment,
      address: this.address,
      email: this.email,
      phone: this.phone,
    };
  }

  clear(): void {
    this.payment = "";
    this.address = null;
    this.email = null;
    this.phone = null;
  }

  validation(): CustomerErrors {
    const customerErrors: CustomerErrors = {};
    if (this.payment === "") {
      customerErrors.payment = "Не выбран вид оплаты";
    }
    if (this.address === null || this.address.trim() === "") {
      customerErrors.address = "Введите адрес доставки";
    }
    if (this.email === null || this.email.trim() === "") {
      customerErrors.email = "Укажите email";
    }
    if (this.phone === null || this.phone.trim() === "") {
      customerErrors.phone = "Укажите телефон";
    }
    return customerErrors;
  }
}

export type CustomerErrors = Partial<Record<keyof ICustomer, string>>;
