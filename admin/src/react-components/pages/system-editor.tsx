import React, { useState, useEffect } from "react";
import { withStyles } from "@material-ui/core/styles";
import { fetchReticulumAuthenticated } from "hubs/src/utils/phoenix-utils";
import withCommonStyles from "../../utils/with-common-styles";
import { getAdminInfo, getEditableConfig } from "../../utils/ita";
import configs from "../../utils/configs";
import { ReticulumMetaT, AdminInfoT, RetConfigT, ErrorT } from "../../../types";
import "../../styles/globals.scss";
import CardSection from "../shared/CardSection";
import { Icon } from "@mozilla/lilypad-ui";
import { DiscordIcon, BookIcon, QuestionIcon, GithubIcon } from "../shared/icons";
import Card from "../shared/Card";
import { hasPaidFeature, isBrandingDisabled } from "../../utils/feature_flags";

const styles = withCommonStyles(() => ({}));

const SystemEditorComponent = ({ classes }) => {
  const [adminInfo, setAdminInfo] = useState<AdminInfoT | null>(null);
  const [retConfig, setRetConfig] = useState<RetConfigT>({} as RetConfigT);
  const [reticulumMeta, setReticulumMeta] = useState<ReticulumMetaT>({} as ReticulumMetaT);
  const [needsAvatars, setNeedsAvatars] = useState<boolean>(false);
  const [needsScenes, setNeedsScenes] = useState<boolean>(false);
  const [exceededStorageQuota, setExceededStorageQuota] = useState<boolean>(false);
  const [isInSESSandbox, setIsInSESSandbox] = useState<boolean>(false);
  const [isUsingCloudflare, setIsUsingCloudflare] = useState<boolean>(false);

  /**
   * Init Component
   */
  useEffect(() => {
    const init = async () => {
      try {
        const service = "reticulum";
        const retResp: RetConfigT | ErrorT = await getEditableConfig(service);
        const adminResp: AdminInfoT | ErrorT = await getAdminInfo();

        if (adminResp.code === 200 && retResp.code === 200) {
          const adminData = adminResp as AdminInfoT;
          const { using_ses, ses_max_24_hour_send } = adminData;
          const retData = retResp as RetConfigT;
          const maxQuotaForSandbox = 200;
          // Send quota to use as heuristic for checking if in SES sandbox
          // https://forums.aws.amazon.com/thread.jspa?threadID=61090

          /**
           * CHECK USER STATUS
           * - Is in a Sandbox
           * - is Using cloud flate
           */
          setRetConfig(retData);
          setAdminInfo(adminData);
          setIsInSESSandbox(using_ses && ses_max_24_hour_send <= maxQuotaForSandbox);
          setIsUsingCloudflare(retConfig.phx.cors_proxy_url_host === `cors-proxy.${adminData.worker_domain}`);
        }

        updateReticulumMeta();
      } catch (error) {
        // TODO impliment an error state in the UI
        // also if any of the above come back error - we need
        // a ui for that as well.
        console.error(error);
      }
    };
    init();
  }, []);

  /**
   * Update Reticulum
   */
  const updateReticulumMeta = async () => {
    const path = `/api/v1/meta?include_repo`;
    const reticulumMeta: ReticulumMetaT = await fetchReticulumAuthenticated(path);

    /**
     * CHECK USER STATUS
     * - Needs Avatars
     * - Needs Scenes
     */
    const { avatar_listings, scene_listings, storage } = reticulumMeta.repo;
    setReticulumMeta(reticulumMeta);
    setNeedsAvatars(!avatar_listings.any);
    setNeedsScenes(!scene_listings.any);
    setExceededStorageQuota(!storage.in_quota);
  };

  return (
    <div className="page_wrapper">
      <Card className="mb-24">
        <h2 className="heading-lg mb-24">开始入门</h2>

        {/* AVATARS / SCENES  */}
        <div className="mb-40">
          <h3 className="heading-sm mb-28">添加头像和场景</h3>

          <CardSection
            className="mb-20"
            ctaCallback={() => {
              window.open(`https://hubs.mozilla.com/docs/hubs-cloud-asset-packs.html`);
            }}
            cta="get more avatars and scenes"
            body="Give your hub visitors more scenes to explore and a wider
              selection of avatars to choose from. Install your new assets
              on the Import Content page."
          />
        </div>

        {/* CUSTOMIZE HUB */}
        <section className="mb-40">
          <h3 className="heading-sm mb-28">自定义中心外观</h3>

          {hasPaidFeature() && !isBrandingDisabled() && (
            <CardSection
              className="mb-20"
              ctaCallback={() => {
                window.location.href = "#/brand";
              }}
              cta="Add my Logo"
              body="Apply your branding to the hub’s website and lobby."
            />
          )}

          <CardSection
            className="mb-20"
            ctaCallback={() => {
              window.location.href = "#/app-settings";
            }}
            cta="Edit hub’s text and details"
            body="Edit your hub’s name, description and other text content for
                  improved search engines results."
          />
        </section>

        {/* CHANGE ROOM */}
        <section className="mb-40">
          <h3 className="heading-sm mb-28">更衣室设置</h3>

          <CardSection
            className="mb-20"
            ctaCallback={() => {
              window.location.href = "#/app-settings";
            }}
            cta="Change room settings"
            body="Specify the default room size and how they are accessed and created."
          />
        </section>

        {/* CHANGE ROOM */}
        <section className="">
          <h3 className="heading-sm">限制谁可以访问你的中心</h3>

          <CardSection
            ctaCallback={() => {
              window.open("https://hubs.mozilla.com/docs/hubs-cloud-limiting-user-access.html");
            }}
            cta="Limit access guide"
            body="Learn how to control who can enter your hub’s rooms."
          />
        </section>
      </Card>

      {/* WARNING  */}
      {reticulumMeta && adminInfo && (needsAvatars || needsScenes || isInSESSandbox || exceededStorageQuota) && (
        <Card>
          <h2 className="heading-lg mb-12">Status</h2>
          {isInSESSandbox && (
            <div className="flex mb-12">
              <div className="mr-20">
                <Icon name="alert-triangle" />
              </div>
              <div className="flex-box">
                <div className="body-md">
                您的AWS账户在{" "}
                  <a
                    href="https://docs.aws.amazon.com/ses/latest/DeveloperGuide/request-production-access.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    AWS简单电子邮件服务沙盒。
                  </a>{" "}
                  Follow instructions in{" "}
                  <a
                    href="https://hubs.mozilla.com/docs/hubs-cloud-aws-troubleshooting.html#youre-in-the-aws-sandbox-and-people-dont-receive-magic-link-emails"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    You&apos;re in the AWS SES Sandbox and people don&apos;t receive magic link emails:
                  </a>
                  Solution #1, #2, #3, or{" "}
                  <a
                    href="https://hubs.mozilla.com/docs/hubs-cloud-aws-existing-email-provider.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                   使用现有的电子邮件提供商
                  </a>
                </div>
                <div className="body-sm">
                用户将无法登录，直到系统可以发送电子邮件. 你&apos;ll 需要任何一个{" "}
                  <a
                    href="https://docs.aws.amazon.com/ses/latest/DeveloperGuide/request-production-access.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                   遵循指示
                  </a>{" "}
                  请求增加限制，或在中设置自定义电子邮件设置{" "}
                  <a href="/admin#/server-setup">服务器设置</a>
                </div>
              </div>
            </div>
          )}
          {exceededStorageQuota && (
            <div className="flex mb-12">
              <div className="mr-20">
                <Icon name="alert-triangle" />
              </div>
              <div className="flex-box">
                <div className="body-md">您已超过指定的存储限制</div>
                <div className="body-sm">
                访问者将不能上传新的场景、头像或文件，直到你增加 &apos;存储
                  限制&apos; 在你的堆栈设置中。
                </div>
              </div>
            </div>
          )}
          {needsAvatars && (
            <div className="flex mb-12">
              <div className="mr-20">
                <Icon name="alert-triangle" />
              </div>
              <div className="flex-box">
                <div className="body-md">您的系统没有头像.</div>
                <div className="body-sm">选择左侧的` Import Content `来加载头像。</div>
              </div>
            </div>
          )}
          {needsScenes && (
            <div className="flex mb-12">
              <div className="mr-20">
                <Icon name="alert-triangle" />
              </div>
              <div className="flex-box">
                <div className="body-md">你的系统没有场景。</div>
                <div className="body-sm">选择左侧的` Import Content `来加载场景。</div>
              </div>
            </div>
          )}
          {!isUsingCloudflare && (
            <div className="flex">
              <div className="mr-20">
                <Icon name="info" />
              </div>
              <div className="flex-box">
                <div className="body-md">
                  {adminInfo.provider === "arbortect"
                    ? "You are not using a CDN."
                    : "You are using your cloud provider to serve content."}
                </div>
                <div className="body-sm">
                你可以通过使用Cloudflare的CDN来提供内容服务，从而降低成本并提高性能。选择
                左边的` Content CDN `可以查看更多信息。
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card>
        <h2 className="heading-lg mb-24">寻求帮助</h2>
        <div className="flex-align-items-center mb-20">
          <div className="mr-20">
            <DiscordIcon />
          </div>
          <p className="body-md">
            The{" "}
            <a className="link" rel="noopener noreferrer" href="https://discord.com/invite/sBMqSjCndj" target="_blank">
            Hubs Discord社区
            </a>{" "}
            是由hub您、用户和管理员构建的
          </p>
        </div>

        <div className="flex-align-items-center mb-20">
          <div className="mr-20">
            <BookIcon />
          </div>
          <p className="body-md">
            The{" "}
            <a
              href="https://hubs.mozilla.com/docs/welcome.html"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              Hubs 文档
            </a>{" "}
            包含入门指南和其他资源
          </p>
        </div>

        <div className="flex-align-items-center mb-20">
          <div className="mr-20">
            <QuestionIcon />
          </div>
          <p className="body-md">
            Visit{" "}
            <a
              href="https://support.mozilla.org/en-US/products/hubs"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              Mozilla 支持
            </a>{" "}
            以寻求有关Hubs订阅的帮助。
          </p>
        </div>

        <div className="flex-align-items-center">
          <div className="mr-20">
            <GithubIcon />
          </div>
          <p className="body-md">
            你可以{" "}
            <a
              rel="noopener noreferrer"
              href="https://github.com/mozilla/hubs/discussions"
              target="_blank"
              className="link"
            >
              向他人寻求信息或解答的行为。
            </a>{" "}
            或者{" "}
            <a className="link" href="https://github.com/mozilla/hubs" target="_blank" rel="noopener noreferrer">
            提出一个问题
            </a>{" "}
            在 GitHub.
          </p>
        </div>
      </Card>

      <div className="flex-align-items-center ml-12">
        <a href="https://hubs.mozilla.com/whats-new" target="_blank" rel="noopener noreferrer" className="link mr-24">
        最新动态
        </a>
        {!configs.IS_LOCAL_OR_CUSTOM_CLIENT && (
          <p className="body-md">{`Hubs version: ${process.env.BUILD_VERSION || "?"}`}</p>
        )}
      </div>

      {configs.IS_LOCAL_OR_CUSTOM_CLIENT && (
        <div className="body-md mt-12 ml-12">
          <p>App客户端:自定义客户端</p>
          <p>{`Undeploy custom client to run build ${process.env.BUILD_VERSION || "?"}`}</p>
          <p>
          记得定期从“hubs-cloud”分支拉入上游变更:{" "}
            <a href="https://github.com/mozilla/hubs" target="_blank" rel="noopener noreferrer" className="link">
              Github
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export const SystemEditor = withStyles(styles)(SystemEditorComponent);
