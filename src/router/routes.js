/*
 * @Description: This is a description
 * @Author: Ask
 * @LastEditors  : Ask
 * @Date: 2019-11-05 08:51:42
 * @LastEditTime : 2019-12-22 22:46:41
 */
import Home from "@comp/home";
import Page404 from "@/components/404/page404";
import PrePage from "@/pages/pre/pre-page.js";

export default [
  {
    path: "/",
    component: Home,
    redirect: "/prepage"
  },
  {
    path: "/prepage/:role",
    component: PrePage
  },
  {
    path: "/*",
    component: Page404,
    meta: {
      title: "404"
    }
  }
];
