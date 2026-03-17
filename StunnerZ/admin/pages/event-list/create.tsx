import Head from "next/head";
import { PureComponent } from "react";
import { message, Layout } from "antd";
import Router from "next/router";
import { BreadcrumbComponent } from "@components/common";
import { eventsService } from "@services/event.service";
import { FormCreateNewEvent } from "@components/event/form-create-event";
import Page from "@components/common/layout/page";

interface IFiles {
  fieldname: string;
  file: File;
}

interface IResponse {
  data: { _id: string };
}
class CreateEventPage extends PureComponent {
  state = {
    uploading: false,
    uploadPercentage: 0,
  };

  _files: {
    image: File;
    digitalFile: File;
  } = {
    image: null,
    digitalFile: null,
  };

  onUploading(resp: any) {
    this.setState({ uploadPercentage: resp.percentage });
  }

  beforeUpload(file: File, field: string) {
    this._files[field] = file;
  }

  async submit(data: any) {
    if (data.type === "digital" && !this._files.digitalFile) {
      message.error("Please select digital file!");
      return;
    }
    if (data.type === "physical") {
      this._files.digitalFile = null;
    }
    const files = Object.keys(this._files).reduce((f, key) => {
      if (this._files[key]) {
        f.push({
          fieldname: key,
          file: this._files[key] || null,
        });
      }
      return f;
    }, [] as IFiles[]) as [IFiles];
    await this.setState({
      uploading: true,
    });
    const datas = {
      ...data,
      startAt: data.date[0].toISOString(),
      endAt: data.date[1].toISOString(),
      price: Number(data.price),
      availability: Number(data.availability),
      isPrivate: Boolean(data.isPrivate),
      performerIds: data.performerIds || [],
    };
    try {
      (await eventsService.createEvent(
        files,
        datas,
        this.onUploading.bind(this)
      )) as IResponse;
      message.success("Event has been created");
      Router.push("/event-list");
    } catch (error) {
      message.error("An error occurred, please try again!");
      this.setState({
        uploading: false,
      });
    }
  }

  render() {
    const { uploading, uploadPercentage } = this.state;
    return (
      <Layout>
        <Head>
          <title>New Event</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: "Event", href: "/event-list" },
            { title: "New Event" },
          ]}
        />
        <Page>
          <FormCreateNewEvent
            submit={this.submit.bind(this)}
            beforeUpload={this.beforeUpload.bind(this)}
            uploading={uploading}
            uploadPercentage={uploadPercentage}
          />
        </Page>
      </Layout>
    );
  }
}

export default CreateEventPage;
