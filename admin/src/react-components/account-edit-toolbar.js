/* eslint-disable @calm/react-intl/missing-formatted-message*/

import React, { useState } from "react";
import { Toolbar, SaveButton } from "react-admin";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import { Dialog, DialogContent, DialogContentText, DialogActions } from "@material-ui/core";

const accountEditToolbarStyles = {
  spaceBetween: { justifyContent: "space-between" },
  dialogActions: { padding: "0 5px" }
};

const DeleteStates = Object.freeze({
  Confirming: Symbol("confirming"),
  Deleting: Symbol("deleting"),
  Succeeded: Symbol("succeeded"),
  Failed: Symbol("failed")
});

export const AccountEditToolbar = withStyles(accountEditToolbarStyles)(props => {
  const { classes, ...other } = props;
  const { Confirming, Deleting, Succeeded, Failed } = DeleteStates;
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [deleteState, setDeleteState] = useState(Confirming);

  const onDeleteAccount = async () => {
    setDeleteState(Deleting);

    try {
      const resp = await fetch(`/api/v1/accounts/${props.id}`, {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          authorization: `bearer ${window.APP.store.state.credentials.token}`
        }
      });

      setDeleteState(resp.ok ? Succeeded : Failed);
    } catch {
      setDeleteState(Failed);
    }
  };

  return (
    <Toolbar {...other} className={`${classes.spaceBetween}`}>
      <SaveButton />

      {!props.record.is_admin && (
        <Button label="Delete" onClick={() => setOpenConfirmationDialog(true)} variant="outlined">
          Delete
        </Button>
      )}

      <Dialog open={openConfirmationDialog}>
        <DialogContent>
          <DialogContentText>
            {(() => {
              switch (deleteState) {
                case Confirming:
                  return (
                    <>
                    您确定要删除帐户吗 {props.id}?<br />
                      <br />
                      <b>警告!</b> 这个账户将被永久删除，包括它的所有场景，资产，
                      化身，房间和文件。 <b>这是无法挽回的。</b>
                    </>
                  );
                case Deleting:
                  return <>删除账户 {props.id}...</>;
                case Succeeded:
                  return <>成功删除帐户 {props.id}.</>;
                case Failed:
                  return <>删除帐户失败 {props.id}.</>;
              }
            })()}
          </DialogContentText>
        </DialogContent>

        <DialogActions className={`${classes.dialogActions} ${classes.spaceBetween}`}>
          {[Succeeded, Failed].includes(deleteState) && (
            <Button
              variant="outlined"
              onClick={() => {
                setOpenConfirmationDialog(false);
                if (deleteState === Succeeded) {
                  props.history.push("/accounts");
                }
              }}
            >
              好的
            </Button>
          )}

          {deleteState === Confirming && (
            <>
              <Button variant="outlined" onClick={onDeleteAccount}>
              是的，永久删除这个帐户
              </Button>
              <Button variant="outlined" onClick={() => setOpenConfirmationDialog(false)}>
               取消
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Toolbar>
  );
});
