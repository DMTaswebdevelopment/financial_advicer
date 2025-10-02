import { PageContentModel } from "@/component/model/interface/PageContentModel";

const PageContentComponent: React.FC<PageContentModel> = (props) => {
  return (
    <>
      <div className="flex flex-col">
        {props.content.header && <div>{props.content.header}</div>}

        <div className={props.content.contentUtils}>
          {props.content.content}
        </div>
      </div>
    </>
  );
};

export default PageContentComponent;
