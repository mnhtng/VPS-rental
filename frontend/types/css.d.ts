declare module "*.css";
declare module "*.scss";
declare module "*.sass";
declare module "*.less";
declare module "*.styl";
declare module "*.pcss";
declare module "*.module.css";
declare module "*.module.scss";
declare module "*.module.sass";
declare module "*.module.less";
declare module "*.module.styl";
declare module "*.module.pcss";

// Allow importing CSS files as strings
declare module "*.css" {
    const content: string;
    export default content;
}
declare module "*.scss" {
    const content: string;
    export default content;
}
declare module "*.sass" {
    const content: string;
    export default content;
}
declare module "*.less" {
    const content: string;
    export default content;
}
declare module "*.styl" {
    const content: string;
    export default content;
}
declare module "*.pcss" {
    const content: string;
    export default content;
}

declare module "*.module.css" {
    const content: { [className: string]: string };
    export default content;
}
declare module "*.module.scss" {
    const content: { [className: string]: string };
    export default content;
}
declare module "*.module.sass" {
    const content: { [className: string]: string };
    export default content;
}
declare module "*.module.less" {
    const content: { [className: string]: string };
    export default content;
}
declare module "*.module.styl" {
    const content: { [className: string]: string };
    export default content;
}
declare module "*.module.pcss" {
    const content: { [className: string]: string };
    export default content;
}
