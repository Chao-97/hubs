/* eslint-disable @calm/react-intl/missing-formatted-message*/
import React from "react";
import { SceneLink, OwnedFileImage, OwnedFileSizeField, ConditionalReferenceField } from "./fields";
import { ApproveSceneButton } from "./approve-buttons";
import { DenySceneButton } from "./deny-buttons";

import { List, TextInput, Datagrid, TextField, DateField, Filter } from "react-admin";

const SceneFilter = props => (
  <Filter {...props}>
    <TextInput label="搜索名称" source="name" alwaysOn />
    <TextInput label="搜索SID" source="scene_sid" alwaysOn />
  </Filter>
);

export const PendingSceneList = props => (
  <List {...props} filters={<SceneFilter />} bulkActionButtons={false}>
    <Datagrid>
      <OwnedFileImage source="screenshot_owned_file_id" />
      <OwnedFileSizeField label="Model size" source="model_owned_file_id" />
      <SceneLink source="scene_sid" />
      <TextField source="name" />
      <TextField source="attributions" />
      <ConditionalReferenceField source="scene_listing_id" reference="scene_listings">
        <TextField source="name" />
      </ConditionalReferenceField>
      <DateField source="updated_at" />
      <ApproveSceneButton />
      <DenySceneButton />
    </Datagrid>
  </List>
);
