/* eslint-disable react/prop-types */
/* eslint-disable @calm/react-intl/missing-formatted-message*/
import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Checkbox from "@material-ui/core/Checkbox";
import CircularProgress from "@material-ui/core/CircularProgress";
import LinearProgress from "@material-ui/core/LinearProgress";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { Title } from "react-admin";
import Button from "@material-ui/core/Button";
import withCommonStyles from "../utils/with-common-styles";
import { getAdminInfo, getEditableConfig, getConfig, putConfig } from "../utils/ita";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import Icon from "@material-ui/core/Icon";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import clsx from "classnames";
import configs from "../utils/configs";

// NOTE there's a mysterious uncaught exception in a promise when this component is shown, that seems
// to be coupled with the "All 3rd party content" typography block. It's a mystery.

const styles = withCommonStyles(() => ({
  worker: {
    width: "600px",
    height: "200px",
    fontFamily: "monospace",
    marginTop: "8px"
  },

  workerInput: {
    padding: "8px",
    width: "250px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    margin: "8px"
  }
}));

const workerScript = (workerDomain, workerInstanceName, assetsDomain) => {
  return `  const ALLOWED_ORIGINS = ["${document.location.origin}"];
  const CORS_PROXY_HOST = "https://${workerInstanceName}-cors-proxy.${workerDomain}";
  const PROXY_HOST = "https://${workerInstanceName}-proxy.${workerDomain}";
  const HUB_HOST = "${document.location.origin}";
  const ASSETS_HOST = "https://${assetsDomain}";

  addEventListener("fetch", e => {
    const request = e.request;
    const origin = request.headers.get("Origin");
    // eslint-disable-next-line no-useless-escape

    const isCorsProxy = request.url.indexOf(CORS_PROXY_HOST) === 0;
    const proxyUrl = new URL(isCorsProxy ? CORS_PROXY_HOST : PROXY_HOST);
    const targetPath = request.url.substring((isCorsProxy ? CORS_PROXY_HOST : PROXY_HOST).length + 1);
    let targetUrl;

    if (targetPath.startsWith("files/") || targetPath.startsWith("thumbnail/")) {
      targetUrl = \`\${HUB_HOST}/\${targetPath}\`;
    } else if (targetPath.startsWith("hubs/") || targetPath.startsWith("spoke/") || targetPath.startsWith("admin/") || targetPath.startsWith("assets/")) {
      targetUrl = \`\${ASSETS_HOST}/\${targetPath}\`;
    } else {
      if (!isCorsProxy) {
        // Do not allow cors proxying from main domain, always require cors-proxy. subdomain to ensure CSP stays sane.
        return;
      }
      // This is a weird workaround that seems to stem from the cloudflare worker receiving the wrong url
      targetUrl = targetPath.replace(/^http(s?):\\/([^/])/, "http$1://$2");

      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        targetUrl = proxyUrl.protocol + "//" + targetUrl;
      }
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete("Origin"); // Some domains disallow access from improper Origins

    e.respondWith((async () => {
      const res = await fetch(targetUrl, { headers: requestHeaders, method: request.method, redirect: "manual", referrer: request.referrer, referrerPolicy: request.referrerPolicy });
      const responseHeaders = new Headers(res.headers);
      const redirectLocation = responseHeaders.get("Location") || responseHeaders.get("location");

      if(redirectLocation) {
        if (!redirectLocation.startsWith("/")) {
          responseHeaders.set("Location",  proxyUrl.protocol + "//" + proxyUrl.host + "/" + redirectLocation);
        } else {
          const tUrl = new URL(targetUrl);
          responseHeaders.set("Location",  proxyUrl.protocol + "//" + proxyUrl.host + "/" + tUrl.origin + redirectLocation);
        }
      }

      if (origin && ALLOWED_ORIGINS.indexOf(origin) >= 0) {
        responseHeaders.set("Access-Control-Allow-Origin", origin);
        responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        responseHeaders.set("Access-Control-Allow-Headers", "Range");
        responseHeaders.set("Access-Control-Expose-Headers", "Accept-Ranges, Content-Encoding, Content-Length, Content-Range, Hub-Name, Hub-Entity-Type");
      }

      responseHeaders.set("Vary", "Origin");
      responseHeaders.set('X-Content-Type-Options', "nosniff");

      return new Response(res.body, { status: res.status, statusText: res.statusText, headers: responseHeaders });
    })());
  });`;
};

class ContentCDNComponent extends Component {
  state = {
    workerDomain: "",
    workerInstanceName: "",
    assetsDomain: "",
    enableWorker: false,
    saving: false,
    saveError: false,
    loading: false
  };

  async componentDidMount() {
    const adminInfo = await getAdminInfo();
    const retConfig = await getEditableConfig("reticulum");
    let workerDomain = "";

    if (!!retConfig && !!retConfig.phx && retConfig.phx.cors_proxy_url_host.includes("workers.dev")) {
      const corsProxyUrlParts = retConfig.phx.cors_proxy_url_host.split(".");
      workerDomain = corsProxyUrlParts[corsProxyUrlParts.length - 3] + ".workers.dev";
    }

    const workerInstanceName =
      "hubs-" +
      adminInfo.server_domain
        .split(".")
        .join("-")
        .toLowerCase()
        .substring(0, 63 - "hubs-".length - "-cors-proxy".length);

    this.setState({
      assetsDomain: adminInfo.assets_domain,
      provider: adminInfo.provider,
      workerInstanceName,
      workerDomain,
      enableWorker: !!workerDomain,
      loading: false
    });
  }

  async onSubmit(e) {
    e.preventDefault();

    // Sanity check
    if (this.state.enableWorker) {
      const abort = () => {
        this.setState({
          saveError: "Your worker isn't working. Check that you've performed all of the above steps."
        });
      };

      try {
        // Need to CORS-proxy the CORS-proxy because CSP will block us otherwise!
        const res = await fetch(
          `https://${configs.CORS_PROXY_SERVER}/https://${this.state.workerInstanceName}-proxy.${this.state.workerDomain}/hubs/pages/latest/whats-new.html`
        );

        if (!res.ok) {
          abort();
          return;
        }
      } catch (e) {
        abort();
        return;
      }
    }

    this.setState({ saving: true }, async () => {
      const workerDomain = this.state.enableWorker ? this.state.workerDomain : "";
      const workerInstanceName = this.state.enableWorker ? this.state.workerInstanceName : "";
      const corsProxyDomain = `${workerInstanceName}-cors-proxy.${workerDomain}`;
      const proxyDomain = `${workerInstanceName}-proxy.${workerDomain}`;

      const hubsConfig = await getConfig("hubs");
      const spokeConfig = await getConfig("spoke");

      let hubsNonCorsProxyDomains = hubsConfig.general.non_cors_proxy_domains;
      let spokeNonCorsProxyDomains = spokeConfig.general.non_cors_proxy_domains;

      if (this.state.enableWorker) {
        if (!hubsNonCorsProxyDomains.includes(proxyDomain)) {
          hubsNonCorsProxyDomains = [...hubsNonCorsProxyDomains.split(",").filter(x => x.length), proxyDomain].join(
            ","
          );
        }
        if (!spokeNonCorsProxyDomains.includes(proxyDomain)) {
          spokeNonCorsProxyDomains = [...spokeNonCorsProxyDomains.split(",").filter(x => x.length), proxyDomain].join(
            ","
          );
        }
      }

      // For arbortect, we enable thumbnail CDN proxying
      const useWorkerForThumbnails = this.state.provider === "arbortect";

      const configs = {
        reticulum: {
          phx: {
            cors_proxy_url_host: workerDomain ? corsProxyDomain : ""
          },
          uploads: {
            host: workerDomain ? `https://${proxyDomain}` : ""
          }
        },
        hubs: {
          general: {
            cors_proxy_server: workerDomain ? corsProxyDomain : "",
            base_assets_path: workerDomain ? `https://${proxyDomain}/hubs/` : "",
            non_cors_proxy_domains: workerDomain ? hubsNonCorsProxyDomains : "",
            thumbnail_server: workerDomain && useWorkerForThumbnails ? proxyDomain : ""
          }
        },
        spoke: {
          general: {
            cors_proxy_server: workerDomain ? corsProxyDomain : "",
            base_assets_path: workerDomain ? `https://${proxyDomain}/spoke/` : "",
            non_cors_proxy_domains: workerDomain ? spokeNonCorsProxyDomains : "",
            thumbnail_server: workerDomain && useWorkerForThumbnails ? proxyDomain : ""
          }
        }
      };

      try {
        for (const [service, config] of Object.entries(configs)) {
          const res = await putConfig(service, config);

          if (res.error) {
            this.setState({ saveError: `Error saving: ${res.error}` });
            break;
          }
        }
      } catch (e) {
        this.setState({ saveError: e.toString() });
      }

      this.setState({ saving: false, saved: true, saveError: null });
    });
  }

  render() {
    if (this.state.loading) {
      return <LinearProgress />;
    }

    const hasValidWorkerDomain = (this.state.workerDomain || "").endsWith("workers.dev");

    return (
      <Card className={this.props.classes.container}>
        <Title title="Content CDN" />
        <form onSubmit={this.onSubmit.bind(this)}>
          <CardContent className={this.props.classes.info}>
            {this.state.provider === "arbortect" && (
              <Typography variant="body2" gutterBottom>
                通过将Cloudflare设置为您的服务器，您可以大大减少服务器上的负载并缩短加载时间CDN。
                <br />
                启用后，Cloudflare将缓存内容、减少延迟并减少服务器使用的带宽。
              </Typography>
            )}
            {this.state.provider && this.state.provider !== "arbortect" && (
              <Typography variant="body2" gutterBottom>
               集散云使用来自云提供商的带宽来交付内容。
                <br />
                你可以通过将CDN切换到Cloudflare来降低数据传输成本，Cloudflare不收取任何费用

用户的数据传输成本。
              </Typography>
            )}
            <Typography variant="subheading" gutterBottom className={this.props.classes.section}>
            工人安装
            </Typography>
            <Typography variant="body1" gutterBottom>
            hub云中的所有第三方内容(视频、图像、模型)都需要CORS代理，因为{" "}
              <a href="https://www.codecademy.com/articles/what-is-cors" rel="noopener noreferrer" target="_blank">
              浏览器安全模型
              </a>
              。因此，您将使用数据传输将所有第三方内容发送给您的用户。
            </Typography>
            {this.state.provider && this.state.provider !== "arbortect" && (
              <Typography variant="body1" gutterBottom>
               此外，您将为服务化身、场景和其他资产产生数据传输成本。
              </Typography>
            )}
            {this.state.provider && this.state.provider !== "arbortect" && (
              <Typography variant="body1" gutterBottom>
              您可以通过使用Cloudflare Worker来提供以下内容来最小化数据传输成本:
              </Typography>
            )}
            <Typography variant="body1" component="div" gutterBottom>
              <ol className={this.props.classes.steps}>
                <li>
                  登记&nbsp;
                  <a href="https://cloudflare.com" target="_blank" rel="noopener noreferrer">
                    Cloudflare
                  </a>
                  .
                </li>
                <li>
                 一旦你&apos;已经报名了, 点击Cloudflare logo进入您的<b>主页</b>栏。 (
                  <b>警告-不要 &quot;添加站点&quot; 对Cloudflare</b>, 你只需要创建worker)
                </li>
                <li>
                  在<b>主页</b> 栏, 点击 <b>Workers</b> 板面. 你&apos;将会被要求创建一个workers子域
                </li>
                <li>
                在这里输入你的workers子域名:
                  <p />
                  <input
                    type="text"
                    placeholder="eg. mysite.workers.dev"
                    className={this.props.classes.workerInput}
                    value={this.state.workerDomain}
                    onChange={e => this.setState({ workerDomain: e.target.value })}
                  />
                </li>
                {hasValidWorkerDomain && (
                  <>
                    <li>
                    在Workers的仪表板上点击 <b>创建 Worker</b>.
                    </li>
                    <li>
                    输入worker的名称(在顶部，脚本上方):
                      <div className={this.props.classes.command}>{this.state.workerInstanceName}-proxy</div>
                    </li>
                    <li>
                    粘贴、保存并部署下面的worker脚本。
                      <br />
                      <textarea
                        className={this.props.classes.worker}
                        value={workerScript(
                          this.state.workerDomain,
                          this.state.workerInstanceName,
                          this.state.assetsDomain
                        )}
                        readOnly
                        onFocus={e => e.target.select()}
                      />
                      <br />
                    </li>
                    <li>
                    重复上面的步骤，使用相同的脚本创建并部署一个新的worker。命名为new工作人员:
                      <div className={this.props.classes.command}>{this.state.workerInstanceName}-cors-proxy</div>
                    </li>
                    <li>
                     不要&apos; 忘记保存并且<b>部署</b> 这两个脚本。
                    </li>
                    <li>
                    验证你的工人正在工作.{" "}
                      <a
                        href={`https://${this.state.workerInstanceName}-cors-proxy.${this.state.workerDomain}/https://www.mozilla.org`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        This link
                      </a>{" "}
                      应该显示Mozilla主页，然后&nbsp;
                      <a
                        href={`https://${this.state.workerInstanceName}-proxy.${this.state.workerDomain}/hubs/pages/latest/whats-new.html`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                       这个链接
                      </a>{" "}
                      should should the Hubs &quot;What&apos;s New&quot; page.
                    </li>
                    <li>
                      一旦 <b>两个</b> 链接都在工作 ,启用 &apos;使用Cloudflare Worker&apos; 设置
点击下面&apos;储存&apos; 在本页。
                    </li>
                    <li>
                    如果你每天需要超过100,000个内容请求，那么你&apos;将需要添加一个Worker

每月额外收费5美元，不受限制。
                    </li>
                  </>
                )}
              </ol>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={this.state.enableWorker}
                    onChange={e => this.setState({ enableWorker: e.target.checked })}
                    value="enableWorker"
                  />
                }
                label="Use Cloudflare Worker"
              />
            </Typography>
            {this.state.saving ? (
              <CircularProgress />
            ) : (
              (!this.state.enableWorker || hasValidWorkerDomain) && (
                <Button
                  onClick={this.onSubmit.bind(this)}
                  className={this.props.classes.button}
                  variant="contained"
                  color="primary"
                >
                  Save
                </Button>
              )
            )}
          </CardContent>
        </form>
        <Snackbar
          anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
          open={this.state.saved || !!this.state.saveError}
          autoHideDuration={10000}
          onClose={() => this.setState({ saved: false, saveError: null })}
        >
          <SnackbarContent
            className={clsx({
              [this.props.classes.success]: !this.state.saveError,
              [this.props.classes.warning]: !!this.state.saveError
            })}
            message={
              <span id="import-snackbar" className={this.props.classes.message}>
                <Icon className={clsx(this.props.classes.icon, this.props.classes.iconVariant)} />
                {this.state.saveError || "Settings saved."}
              </span>
            }
            action={[
              <IconButton key="close" color="inherit" onClick={() => this.setState({ saved: false })}>
                <CloseIcon className={this.props.classes.icon} />
              </IconButton>
            ]}
          />
        </Snackbar>
      </Card>
    );
  }
}

export const ContentCDN = withStyles(styles)(ContentCDNComponent);
