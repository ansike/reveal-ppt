/*
 * @Description: This is a description
 * @Author: Ask
 * @LastEditors  : Ask
 * @Date: 2019-10-27 20:46:59
 * @LastEditTime : 2019-12-24 10:28:19
 */
// @flow
import React, { Component } from "react";
import { LongLink } from "@/utils/longLink.js";
// import { Button } from "antd-mobile";

const Reveal = window.Reveal;
class PrePage extends Component {
  constructor(props) {
    super(props);
    const { role } = this.props.match.params;
    this.state = {
      currentPage: 1,
      role
    };
    this.prevPage = this.prevPage.bind(this);
    this.nextPage = this.nextPage.bind(this);
    this.longLink = LongLink.getInstance({
      sigNo: 50002, // 配置信令号
      onMessage: data => {
        console.log("onMessage", data);
        this.dealData(data);
      }
    });
  }

  componentDidMount() {
    const { role } = this.state;
    Reveal.initialize({
      controls: parseInt(role, 10) === 1 ? true : false,
      controlsLayout: "bottom-center",
      slideNumber: true
    });
    // Reveal.slide(4);
    Reveal.addEventListener("slidechanged", event => {
      // event.previousSlide, event.currentSlide, event.indexh, event.indexv
      console.log(event);
      this.gotoPage(event.indexh);
    });
  }

  dealData(data) {
    switch (data.type) {
      case "getImage":
      case "nextPage":
      case "prevPage":
        this.setState({ currentPage: data.currentPage }, () => {
          Reveal.slide(data.currentPage - 1);
        });
        break;
      case "gotoPage":
        Reveal.slide(data.currentPage - 1);
        break;
      case "onOpen":
        this.getCurrentPage();
        break;
      default:
        break;
    }
  }
  /**
   * @Description: 获取当前页码
   */
  getCurrentPage() {
    this.longLink.pushLongMsg({
      type: "getImage"
    });
  }

  gotoPage(pageIndex) {
    this.setState(
      {
        currentPage: pageIndex + 1
      },
      () => {
        this.longLink.pushLongMsg({
          type: "gotoPage",
          currentPage: pageIndex + 1
        });
      }
    );
  }

  prevPage() {
    const { currentPage } = this.state;
    this.setState(
      {
        currentPage: currentPage - 1
      },
      () => {
        this.longLink.pushLongMsg({
          type: "prevPage",
          currentPage: currentPage - 1
        });
      }
    );
  }

  nextPage() {
    const { currentPage } = this.state;
    this.setState(
      {
        currentPage: currentPage + 1
      },
      () => {
        this.longLink.pushLongMsg({
          type: "nextPage",
          currentPage: currentPage + 1
        });
      }
    );
  }

  render() {
    const { role } = this.state;
    console.log(role);
    return (
      <div className="prev">
        <div className="reveal">
          <div className="slides">
            <section>Slide 1</section>
            <section>Slide 2</section>
            <section>Slide 3</section>
            <section>Slide 4</section>
            <section>Slide 5</section>
            <section>Slide 6</section>
            <section>Slide 7</section>
            <section>Slide 8</section>
            <section>Slide 9</section>
            <section>Slide 10</section>
            <section>Slide 11</section>
            <section>Slide 12</section>
            <section>Slide 13</section>
            <section>Slide 14</section>
            <section>Slide 15</section>
          </div>
        </div>
      </div>
    );
  }
}

export default PrePage;
