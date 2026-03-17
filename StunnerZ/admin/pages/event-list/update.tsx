import Head from "next/head";
import { PureComponent } from "react";
import Page from "@components/common/layout/page";
import { message } from "antd";
import Loader from "@components/common/base/loader";
import { BreadcrumbComponent } from "@components/common";
import Router from "next/router";
import { eventsService } from "@services/event.service";
import { FormCreateNewEvent } from "@components/event/form-create-event";

interface IProps {
  id: string;
}

interface IFiles {
  fieldname: string;
  file: File;
}

class EventUpdatePage extends PureComponent<IProps> {
  state = {
    submiting: false,
    fetching: true,
    events: {},
    uploadPercentage: 0,
  };

  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  _files: {
    image: File;
    digitalFile: File;
  } = {
    image: null,
    digitalFile: null,
  };

  async componentDidMount() {
    const { id } = this.props;
    try {
      const resp = await eventsService.getDetail(id);
      this.setState({ events: resp.data });
    } catch (e) {
      message.error("Event not found!");
    } finally {
      this.setState({ fetching: false });
    }
  }

  onUploading(resp: any) {
    if (this._files.image || this._files.digitalFile) {
      this.setState({ uploadPercentage: resp.percentage });
    }
  }

  beforeUpload(file: File, field: string) {
    this._files[field] = file;
  }

  async submit(data: any) {
    const { id } = this.props;
    const { events }: any = this.state;
    try {
      const files = Object.keys(this._files).reduce((f, key) => {
        if (this._files[key]) {
          f.push({
            fieldname: key,
            file: this._files[key] || null,
          });
        }
        return f;
      }, [] as IFiles[]) as [IFiles];
      await this.setState({ submiting: true });
      const datas = {
        ...data,
        startAt: data.date ? data.date[0].toISOString() : events?.startAt,
        endAt: data.date ? data.date[1].toISOString() : events?.startAt,
        price: Number(data.price),
        availability: Number(data.availability),
        isPrivate: Boolean(data.isPrivate),
        performerIds: data.performerIds
          ? data.performerIds
          : events?.performerIds,
      };
      await eventsService.update(id, files, datas, this.onUploading.bind(this));
      message.success("Updated successfully");
      Router.push("/event-list");
    } catch (e) {
      // TODO - check and show error here
      message.error("Something went wrong, please try again!");
      this.setState({ submiting: false });
    }
  }

  render() {
    const { events, submiting, fetching, uploadPercentage } = this.state;
    return (
      <>
        <Head>
          <title>Update Event</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: "Event List", href: "/event-list" },
            { title: "Update" },
          ]}
        />
        <Page>
          {fetching ? (
            <Loader />
          ) : (
            <Page>
              <FormCreateNewEvent
                event={events}
                submit={this.submit.bind(this)}
                beforeUpload={this.beforeUpload.bind(this)}
                uploading={submiting}
                uploadPercentage={uploadPercentage}
              />
            </Page>
          )}
        </Page>
      </>
    );
  }
}

export default EventUpdatePage;
