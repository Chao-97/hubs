import React from "react";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";

export const UnauthorizedPage = () => (
  <div
    style={{
      marginLeft: "auto",
      marginRight: "auto",
      padding: "20px",
      maxWidth: "700px"
    }}
  >
    <Card>
      <CardContent
        style={{
          padding: "40px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        {/* eslint-disable-next-line @calm/react-intl/missing-formatted-message */}
        <Typography variant="title">对不起!您的帐户不是管理员。</Typography>
        {/* eslint-disable-next-line @calm/react-intl/missing-formatted-message */}
        <Button variant="contained" style={{ marginTop: "40px" }} color="secondary" href="/">
         返回主页
        </Button>
      </CardContent>
    </Card>
  </div>
);
