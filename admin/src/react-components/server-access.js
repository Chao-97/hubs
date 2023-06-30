/* eslint-disable react/prop-types */
/* eslint-disable @calm/react-intl/missing-formatted-message*/

import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import { Title } from "react-admin";
import Button from "@material-ui/core/Button";
import withCommonStyles from "../utils/with-common-styles";
import { getAdminInfo } from "../utils/ita";

const styles = withCommonStyles(() => ({}));

class ServerAccessComponent extends Component {
  state = {
    qrCodeData: null,
    serverDomain: "",
    showQrCode: false
  };

  async componentDidMount() {
    const adminInfo = await getAdminInfo();
    this.setState({
      qrCodeData: adminInfo.ssh_totp_qr_data,
      serverDomain: adminInfo.server_domain,
      provider: adminInfo.provider
    });
  }

  render() {
    return (
      <Card className={this.props.classes.container}>
        <Title title="Server Access" />
        <CardContent className={this.props.classes.info}>
          <Typography variant="body2" gutterBottom>
          集散云通过SSH访问和双因素身份验证设置服务器。
          </Typography>
          <Typography variant="subheading" className={this.props.classes.section} gutterBottom>
          连接到服务器
          </Typography>
          <Typography variant="body1" gutterBottom>
          要SSH到你的服务器，你需要使用在部署Hubs Cloud之前创建的SSH私钥文件。
          </Typography>
          {this.state.provider !== "arbortect" && (
            <Typography variant="body1" gutterBottom>
            每个服务器都有一个名称。该名称可以在您的云提供商中找到&apos; 服务器端的控制台
列表。 (例如，在AWS控制台中，转到EC2 -&gt;)
            </Typography>
          )}
          <Typography variant="body1" gutterBottom component="div">
          要连接到服务器，运行以下命令:
            {this.state.provider === "arbortect" && (
              <div className={this.props.classes.command}>ssh -i &lt;关键文件&gt; root@{this.state.serverDomain}</div>
            )}
            {this.state.provider === "aws" && (
              <div className={this.props.classes.command}>
                ssh -i &lt;关键文件&gt; ubuntu@&lt;服务器名称&gt;.{this.state.serverDomain}
              </div>
            )}
          </Typography>
          {this.state.qrCodeData && (
            <div>
              <Typography variant="subheading" className={this.props.classes.section} gutterBottom>
              双因素认证
              </Typography>
              <Typography variant="body1" gutterBottom>
              在连接时，如果您的服务器上已经配置了2FA，那么您将需要一次验证

代码。这是一个两方面的安全措施，并且是一个旋转的六位数。
              </Typography>
              <Typography variant="body1" gutterBottom>
              首先，您需要通过安装一个双重因素应用程序(如谷歌Authenticator)来设置设备。
              </Typography>
              <Typography variant="body1" gutterBottom>
              要生成代码，请打开authenticator应用程序并扫描下面的二维码。
              </Typography>
              {this.state.showQrCode ? (
                <img style={{ width: "256px", height: "256px" }} src={this.state.qrCodeData} />
              ) : (
                <Button
                  className={this.props.classes.button}
                  variant="outlined"
                  onClick={() => this.setState({ showQrCode: true })}
                >
                 显示二维码
                </Button>
              )}
            </div>
          )}
          <Typography variant="subheading" className={this.props.classes.section} gutterBottom>
          更多信息
          </Typography>
          <Typography variant="body1" gutterBottom>
          关于服务器设置的文档和常见任务的提示可以在{" "}
            <a
              href="https://hubs.mozilla.com/docs/hubs-cloud-accessing-servers.html"
              rel="noopener noreferrer"
              target="_blank"
            >
              务器向导
            </a>
            .
          </Typography>
        </CardContent>
      </Card>
    );
  }
}

export const ServerAccess = withStyles(styles)(ServerAccessComponent);
