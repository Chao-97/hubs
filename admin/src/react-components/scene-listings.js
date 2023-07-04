/* eslint-disable @calm/react-intl/missing-formatted-message*/
import React from "react";
import { SceneLink, OwnedFileImage, OwnedFileSizeField } from "./fields";
import { FeatureSceneListingButton } from "./feature-listing-buttons";
import { ToolbarWithoutDelete } from "./toolbar-without-delete";

import {
  List,
  Edit,
  SimpleForm,
  TextInput,
  EditButton,
  SelectInput,
  Datagrid,
  TextField,
  ReferenceField,
  DateField,
  BooleanField,
  Filter,
  ArrayInput,
  SimpleFormIterator
} from "react-admin";

const SceneListingFilter = props => (
  <Filter {...props}>
    <TextInput label="搜索名称" source="name" alwaysOn />
    <TextInput label="搜索SID" source="scene_listing_sid" alwaysOn />
  </Filter>
);

export const SceneListingEdit = props => (
  <Edit {...props}>
    <SimpleForm toolbar={<ToolbarWithoutDelete />}>
      <TextInput source="name" />
      <ArrayInput source="tags.tags" defaultValue={[]}>
        <SimpleFormIterator>
          <TextInput />
        </SimpleFormIterator>
      </ArrayInput>
      <SelectInput
        label="状态"
        source="state"
        choices={[
          { id: "active", name: "active" },
          { id: "delisted", name: "delisted" }
        ]}
      />
    </SimpleForm>
  </Edit>
);

export const SceneListingList = props => (
  <List {...props} filters={<SceneListingFilter />} bulkActionButtons={false}>
    <Datagrid>
      <OwnedFileImage source="screenshot_owned_file_id" label="模型示意图"/>
      <OwnedFileSizeField label="模型大小" source="model_owned_file_id" />
      <TextField source="name" label="名称" />
      <SceneLink source="scene_listing_sid"  label="场景列表SID"/>
      <ReferenceField label="场景" source="scene_id" reference="scenes">
        <TextField source="name" />
      </ReferenceField>
      <ReferenceField label="允许重新合成" source="scene_id" reference="scenes" linkType={false}>
        <BooleanField source="allow_remixing" />
      </ReferenceField>
      <ReferenceField label="允许优化" source="scene_id" reference="scenes" linkType={false}>
        <BooleanField source="allow_promotion" />
      </ReferenceField>
      <DateField source="updated_at" label="更新时间" />
      <TextField label="状态" source="state" />
      <FeatureSceneListingButton />
      <EditButton />
    </Datagrid>
  </List>
);
