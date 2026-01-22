import { TGetProducts, TPostCustomers } from "../../types";
import { API_URL } from "../../utils/constants";
import { Api } from "../base/Api";

export class WebLarekApi {
  private api: Api;
  private API_ORIGIN: string = API_URL;

  constructor() {
    this.api = new Api(this.API_ORIGIN);
  }

  getProducts(): Promise<TGetProducts> {
    return this.api.get("/product/");
  }

  postCustomer(data: object): Promise<TPostCustomers> {
    return this.api.post("/order/", data);
  }
}
