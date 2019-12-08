/*
 * @Description: 通用列表页加载组件
 * @Author: Ask
 * @LastEditors: Ask
 * @Date: 2019-12-06 22:33:51
 * @LastEditTime: 2019-12-10 22:37:21
 eg:
 <List label="detail" api={QUESTION.GET_NEW_QUESTION} item={AnswerItem} />
  参数:   type            desc
  label:  string          当前组件的唯一标识
  api:    string          数据请求的地址
  item:   jsx对象          列表渲染的组件(必须是function组件)
 */

import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { findDOMNode } from "react-dom";
import { ListView } from "antd-mobile";
import { post } from "@/utils/request.js";

function MyBody(props) {
  return (
    <div className="am-list-body my-body">
      <span style={{ display: "none" }}>you can custom body wrap element</span>
      {props.children}
    </div>
  );
}

const dataBlobs = {};
let pageIndex = 1;
let totalPage = 1;
let tempData = [];
let rowIDs = [];

class List extends Component {
  constructor(props) {
    super(props);
    tempData = [];
    rowIDs = [];
    totalPage = 1;
    pageIndex = 1;
    const getRowData = (dataBlob, sectionID, rowID) => dataBlob[rowID];
    this.getData = this.getData.bind(this);
    const dataSource = new ListView.DataSource({
      getRowData,
      rowHasChanged: (row1, row2) => row1 !== row2,
      sectionHeaderHasChanged: (s1, s2) => s1 !== s2
    });

    this.state = {
      data: props.data,
      dataSource,
      isLoading: true,
      height: (document.documentElement.clientHeight * 3) / 4
    };
  }

  componentDidMount() {
    const hei = findDOMNode(this.lv).parentNode.clientHeight;
    this.setState({
      height: findDOMNode(this.lv).parentNode.clientHeight
    });
    console.log(findDOMNode(this.lv).parentNode.offsetTop);
    console.log(findDOMNode(this.lv).parentNode.parentNode.scrollTop);
    console.log(findDOMNode(this.lv).parentNode.clientHeight);
    this.updateData();
  }

  onEndReached = event => {
    console.log(pageIndex);
    if (pageIndex >= totalPage) {
      return;
    }
    ++pageIndex;
    if (this.state.isLoading) {
      return;
    }
    console.log("reach end", event);
    this.setState({ isLoading: true });
    this.updateData(pageIndex);
  };

  async updateData(pageIndex) {
    const data = await this.getData(pageIndex);
    this.dealData(data);
  }
  /*
   * @Description: 处理数据
   */
  dealData(data) {
    const { label } = this.props;
    // console.log(data);
    for (let jj = 0; jj < data.length; jj++) {
      const rowName = `${pageIndex}-${label}-M${jj}`;
      rowIDs.push(rowName);
      dataBlobs[rowName] = rowName;
    }
    rowIDs = [...rowIDs];
    console.log(rowIDs);

    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(dataBlobs, rowIDs),
      isLoading: false
    });
  }

  async getData(pageIndex) {
    const { api, perpagenum } = this.props;
    return new Promise(resolve => {
      post(api, {
        currentPage: pageIndex || 1,
        pageSize: perpagenum || 10,
        user_id: 1
      })
        .then(res => {
          tempData = [].concat(res.data.rows, tempData);
          totalPage = res.data.totalPage;
          resolve(res.data.rows);
        })
        .catch(e => {
          console.log(e);
          this.setState({
            isLoading: false
          });
        });
    });
  }

  render() {
    // console.log(this.props.item);
    // const { data } = this.state;
    const Child = this.props.item;
    const separator = (sectionID, rowID) => (
      <div
        key={`${sectionID}-${rowID}`}
        style={{
          backgroundColor: "#F5F5F9",
          height: 8,
          borderTop: "1px solid #ECECED",
          borderBottom: "1px solid #ECECED"
        }}
      />
    );
    let index = 0;
    const row = (rowData, sectionID, rowID) => {
      if (index < 0) {
        index = 0;
      }
      console.log(index);
      const obj = tempData[index++];
      return <Child data={obj} />;
    };

    return (
      <ListView
        ref={el => (this.lv = el)}
        dataSource={this.state.dataSource}
        renderFooter={() => (
          <div
            style={{
              padding: this.props.renderFooterPadding || "10px",
              textAlign: "center"
            }}
          >
            {this.state.isLoading ? "加载中..." : "没有更多了"}
          </div>
        )}
        renderBodyComponent={() => <MyBody />}
        renderRow={row}
        renderSeparator={separator}
        style={{
          height: this.state.height,
          overflow: "auto"
        }}
        pageSize={10}
        onScroll={() => {
          console.log("scroll");
        }}
        scrollRenderAheadDistance={500}
        onEndReached={this.onEndReached}
        onEndReachedThreshold={20}
      />
    );
  }
}

export default withRouter(List);