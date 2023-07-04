/* eslint-disable @calm/react-intl/missing-formatted-message*/
import React from "react";
import { SceneLink, OwnedFileImage, OwnedFileSizeField } from "./fields";
import { ApproveSceneButton } from "./approve-buttons";
import { ToolbarWithoutDelete } from "./toolbar-without-delete";

import {
  List,
  Edit,
  SimpleForm,
  TextInput,
  EditButton,
  SelectInput,
  BooleanInput,
  Datagrid,
  TextField,
  DateField,
  BooleanField,
  Filter
} from "react-admin";

const SceneFilter = props => (
  <Filter {...props}>
    <TextInput label="搜索名称" source="name" alwaysOn />
    <TextInput label="搜索SID" source="scene_sid" alwaysOn />
  </Filter>
);

export const SceneEdit = props => (
  <Edit {...props}>
    <SimpleForm toolbar={<ToolbarWithoutDelete />}>
      <TextInput source="name" />
      <SelectInput
        label="状态"
        source="state"
        choices={[
          { id: "active", name: "active" },
          { id: "removed", name: "removed" }
        ]}
      />
      <BooleanInput source="allow_remixing" />
      <BooleanInput source="allow_promotion" />
    </SimpleForm>
  </Edit>
);

export const SceneList = props => (
  <List {...props} filters={<SceneFilter />} bulkActionButtons={false}>
    <Datagrid>
      <OwnedFileImage source="screenshot_owned_file_id" label="场景示意图"/>
      <OwnedFileSizeField label="模型大小" source="model_owned_file_id" />
      <TextField source="name" label="名称"/>
      <SceneLink source="scene_sid" label="场景SID"/>
      <BooleanField source="allow_remixing" label="允许重新合成"/>
      <BooleanField source="allow_promotion" label="允许优化"/>
      <DateField source="updated_at" label="更新时间"/>
      <TextField label="状态" source="state" />
      <EditButton />
      <ApproveSceneButton />
    </Datagrid>
  </List>
);
