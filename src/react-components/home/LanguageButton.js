import React from "react";
import { FormattedMessage } from "react-intl";
import { createAndRedirectToNewHub } from "../../utils/phoenix-utils";
import { Button } from "../input/Button";
import { useCssBreakpoints } from "react-use-css-breakpoints";
import { setLocale ,setDefaultLocale} from "../../utils/i18n";
import styles from "./LanguageButton.scss";

export function LanguageButton() {
    const store = window.APP.store;
     
    const myFunction=()=> {
        document.getElementById("myDropdown").classList.toggle(styles.show);
    }
      
  return (
    // <a onClick={local => {setLocale("en")}} className={styles.language}>
    //     <FormattedMessage id="language" defaultMessage="Language" />
    // </a>
    <div className={styles.dropdown}>
        <button className={styles.dropbtn} onClick={myFunction}>
            <FormattedMessage id="language" defaultMessage="Language" />
            <i className={styles.fa}></i>
        </button>
        <div className={styles.dropdowncontent} id="myDropdown">
            <a onClick={
                local => {
                        // setLocale("en");
                        store.update({ preferences: { locale: "en" } });
                        myFunction()}
                } className={styles.language}>English</a>
            <a onClick={
                local => {
                        // setLocale("zh-CN");
                        store.update({ preferences: { locale: "zh-CN" } });
                        myFunction()
                }} className={styles.language}>中文(简体)</a>
            <a onClick={
                local => {
                        // setLocale("zh-TW");
                        store.update({ preferences: { locale: "zh-TW" } });
                        myFunction()
                }} className={styles.language}>中文(繁体)</a>
            <a onClick={
                local => {
                        // setLocale("jp");
                        store.update({ preferences: { locale: "jp" } });
                        myFunction()
                }} className={styles.language}>日语</a>
        </div>
    </div> 

  );
}