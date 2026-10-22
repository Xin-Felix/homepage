# Third-party notices

本项目自身使用 MIT License。运行和构建依赖保留各自许可证：

- Spring Boot、Caffeine、Bucket4j、Lombok、ZXing：见各项目发布包许可证；
- `org.lionsoul:ip2region` 及随镜像发布的 v3.18.0 XDB 离线地区数据：Apache-2.0 OR MIT，来源见 [ip2region](https://github.com/lionsoul2014/ip2region)；
- Nuxt、Vue、Pinia、`@pinia/nuxt`、`nuxt-security`、Marked、sanitize-html：MIT；
- `@resvg/resvg-js`：MPL-2.0（作为未修改依赖使用）；
- Noto CJK fonts：SIL Open Font License 1.1；
- MySQL Community Server：GPLv2。

界面与信息架构参考以下 MIT 开源项目：

- [Bentofolio](https://github.com/mkhoirulwafa18/bentofolio)；
- [Magic UI Portfolio](https://github.com/dillionverma/portfolio)；
- [SoybeanAdmin](https://github.com/soybeanjs/soybean-admin)；
- [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin)；
- [Nuxt Dashboard Template](https://github.com/nuxt-ui-pro/dashboard)。

这些项目用于设计调研和模块化思路参考，不作为运行依赖，也没有直接复制其业务源码。完整依赖版本由 `backend/pom.xml` 和 `frontend/package-lock.json` 固定。生产镜像中的第三方组件不改变本仓库原创源代码的 MIT 授权。
