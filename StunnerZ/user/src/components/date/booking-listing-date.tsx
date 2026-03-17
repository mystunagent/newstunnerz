import BarTitleHome from '@components/common/base/bar-title-home';
import {
  Button, Calendar, Card, Col, message, Modal, Row,
  Spin,
  TimePicker
} from 'antd';
import './booking-listing-date.less';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { bookingStreamService } from '@services/booking-stream';
import { connect } from 'react-redux';
import { availableTimeStreamService } from '@services/available-time.service';

type IProps = {
  user: any;
  performer: any;
}

function DateBookingStream({ user, performer }: IProps) {
  const [items, setItems] = useState<any>();
  const [timeSelected, setTimeSelected] = useState<any>();
  const [timeEndSelected, setEndTimeSelected] = useState<any>('');
  const [openSelectTime, setOpenSelectTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataItem, setDateItem] = useState([]);
  const [dataTimeBooked, setDateTimeBooked] = useState([]);
  const [loadingItem, setLoadingItem] = useState(false);
  const [dataCalendar, setDataCalendar] = useState([]);
  const handleBookStream = async () => {
    try {
      if (!user._id) {
        message.error('Please login first to book');
        return;
      }
      if (!performer._id) {
        message.error('Please provide a performer to book');
        return;
      }

      if (user.isPerformer) {
        message.error('just have user accept book stream');
        return;
      }

      if (!items?._id) {
        message.error('Please select a time to book the stream');
        return;
      }

      if (!timeSelected) {
        message.error('Please select a time to book');
        return;
      }

      const newHour = timeSelected.hour();
      const newMinute = timeSelected.minute();
      const newEndHour = timeEndSelected.hour();
      const newEndMinute = timeEndSelected.minute();
      const newStartDate = moment(items.startAt).hour(newHour).minute(newMinute).toDate();
      const newEndDate = moment(items.endAt).hour(newEndHour).minute(newEndMinute).toDate();

      setLoading(true);
      await bookingStreamService.create(performer._id, {
        idTime: items?._id?.toString(),
        startAt: newStartDate.toISOString(),
        endAt: newEndDate.toISOString()
      });
      setLoading(false);
      message.success('Booked successfully');
      setTimeSelected('');
      setEndTimeSelected('');
      setOpenSelectTime(false);
    } catch (error) {
      setLoading(false);
      const e = await error;
      message.error(e?.message || 'An error occurred');
    }
  };

  const handleLoadDataRenderCalendar = async () => {
    try {
      let resp;
      if (user && user.isPerformer && user._id === performer._id) {
        resp = await availableTimeStreamService.myList({
          startAt: moment()
        });
      } else {
        resp = await availableTimeStreamService.userSearch({
          performerId: performer._id,
          startAt: moment()
        });
      }
      setDataCalendar(resp?.data?.data);
    } catch (error) {
      setLoadingItem(false);
      const e = await error;
      message.error(e?.message || 'An error occurred');
    }
  };

  const handleLoadItemTime = async (payload: any) => {
    try {
      setLoadingItem(true);
      let resp;

      if (user && user.isPerformer && user._id === performer._id) {
        resp = await availableTimeStreamService.myList({
          startAt: moment(payload).subtract(1, 'day'),
          endAt: payload
        });
      } else {
        resp = await availableTimeStreamService.userSearch({
          performerId: performer._id,
          startAt: moment(payload).subtract(1, 'day'),
          endAt: payload
        });
      }
      const filteredData: any[] = [];
      await resp?.data?.data.forEach((item: any) => {
        const itemDate = moment(item.startAt);

        if (itemDate.isSame(moment(payload), 'day')) {
          filteredData.push(item);
        }
      });

      setDateItem(filteredData);
      setLoadingItem(false);
    } catch (error) {
      setLoadingItem(false);
      const e = await error;
      message.error(e?.message || 'An error occurred');
    }
  };

  const handleLoadTimeBooked = async (payload: any) => {
    try {
      let resp;

      if (user && user.isPerformer && user._id === performer._id) {
        resp = await bookingStreamService.performerSearch({
          startAt: moment(payload).subtract(1, 'day'),
          endAt: payload,
          status: 'approved',
          limit: 99
        });
      } else {
        resp = await bookingStreamService.userSearch({
          performerId: performer._id,
          startAt: moment(payload).subtract(1, 'day'),
          endAt: payload,
          status: 'approved',
          limit: 99
        });
      }
      const filteredData: any[] = [];
      await resp?.data?.data.forEach((item: any) => {
        const itemDate = moment(item.startAt);

        if (itemDate.isSame(moment(payload), 'day')) {
          filteredData.push(item);
        }
      });

      setDateTimeBooked(filteredData);
    } catch (error) {
      const e = await error;
      message.error(e?.message || 'An error occurred');
    }
  };

  useEffect(() => {
    handleLoadItemTime(moment());
    handleLoadTimeBooked(moment());
    handleLoadDataRenderCalendar();
  }, []);

  const disabledHours = () => {
    const hours = [];
    const start = moment(items?.startAt);
    const end = moment(items?.endAt);
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < start.hour(); i++) {
      hours.push(i);
    }
    // eslint-disable-next-line no-plusplus
    for (let i = end.hour() + 1; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  const disabledTimeMinutes = (selectedHour: number): number[] => {
    const filteredDataTimeBooked = dataTimeBooked && dataTimeBooked.filter((item) => item.idSetUpTime === items._id);

    let disabledMinutes: number[] = [];

    // Disable minutes of items.startAt and items.endAt
    const itemStart = moment(items.startAt);
    if (selectedHour === itemStart.hour()) {
      disabledMinutes = [...disabledMinutes, ...Array.from({ length: itemStart.minute() }, (_, i) => i)];
    }
    const itemEnd = moment(items.endAt);
    if (selectedHour === itemEnd.hour()) {
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i <= 60 - itemEnd.minute(); i++) {
        disabledMinutes.push(i + itemEnd.minute() + 1);
      }
    }
    if (filteredDataTimeBooked.length > 0) {
      filteredDataTimeBooked.forEach((item) => {
        const start = moment(item.startAt);
        const end = moment(item.endAt);

        // Disable minutes of item and filteredDataTimeBooked
        if (selectedHour === start.hour() && selectedHour === end.hour()) {
          // eslint-disable-next-line no-plusplus
          for (let i = 0; i <= end.minute() - start.minute(); i++) {
            disabledMinutes.push(i + start.minute());
          }
        } else if (selectedHour === start.hour()) {
          const minutes = (60 - start.minute());
          // eslint-disable-next-line no-plusplus
          for (let i = 0; i <= minutes; i++) {
            disabledMinutes.push(i + start.minute());
          }
        } else if (selectedHour === end.hour()) {
          // eslint-disable-next-line no-plusplus
          for (let i = 0; i <= end.minute(); i++) {
            disabledMinutes.push(i);
          }
        } else if (selectedHour > start.hour() && selectedHour < end.hour()) {
          // eslint-disable-next-line no-plusplus
          for (let i = 0; i <= 60; i++) {
            disabledMinutes.push(i + start.minute());
          }
        }
      });
    }

    return Array.from(new Set(disabledMinutes));
  };

  const dateCellRender = (date) => {
    const startOfDate = moment(date).startOf('day');
    const endOfDate = moment(date).endOf('day');
    const listData = dataCalendar.filter(
      (record) => moment(record.startAt).isBefore(endOfDate)
        && moment(record.startAt).isAfter(startOfDate)
    );
    return (
      <ul>
        {listData.map((record) => (
          <li key={record._id} className="events-list-custom">
            <p />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="main-container">
      <BarTitleHome title="Book a Private live streaming" />
      <Card>
        <div className="custom-date-book-stream">
          <h3 className="text-center">
            {`My Private Live streaming pricing is $${performer?.pricePerMinuteBookStream || 0}/minute`}
          </h3>
          <br />
          <Row>
            <Col xs={24} md={24} lg={10}>
              <Calendar
                className="event-parents-custom"
                dateCellRender={dateCellRender}
                disabledDate={(currentDate) => (currentDate && currentDate < moment().subtract(1, 'day'))}
                fullscreen={false}
                onChange={(e) => { handleLoadItemTime(moment(e).toISOString()); handleLoadTimeBooked(moment(e).toISOString()); }}
              />
            </Col>
            <Col xs={24} md={16} lg={8}>
              <div className="text-available-time">Available Timings</div>
              {
                loadingItem && (
                  <div className="text-center">
                    <Spin />
                  </div>
                )
              }
              {
                dataItem && dataItem.length > 0 ? (
                  <>
                    <Row>
                      {
                        dataItem.map((item) => (
                          <Col key={item._id} xs={12} md={12} lg={12}>
                            <Button
                              style={{ width: '100%' }}
                              disabled={item.status !== 'active' || moment(item.endAt).isBefore(moment())}
                              onClick={() => { setItems(item); setOpenSelectTime(true); setTimeSelected(moment(item.startAt)); setEndTimeSelected(moment(item.endAt)); }}
                            >
                              {`${moment(item.startAt).format('HH:mm')} - ${moment(item.endAt).format('HH:mm')}`}
                            </Button>
                          </Col>
                        ))
                      }
                    </Row>
                    {/* <br />
                    <div className="text-center">
                      <Button loading={loading} disabled={user && user.isPerformer} onClick={handleBookStream} type="primary">Request a Private Live Streaming</Button>
                    </div> */}
                  </>
                ) : (
                  <div className="text-center">
                    <span>No available timings</span>
                  </div>
                )
              }
            </Col>
            <Col xs={24} md={8} lg={6}>
              <div className="text-available-time">Booked Timings</div>
              {
                dataItem && dataItem.length > 0
                ? (dataTimeBooked && dataTimeBooked.length > 0 && (
                  <>
                    <Row>
                      {
                        dataTimeBooked.map((item) => (
                          <Col className="text-center" key={item._id} xs={24} md={24} lg={24}>
                            <Button disabled>{`${moment(item.startAt).format('HH:mm')} - ${moment(item.endAt).format('HH:mm')}`}</Button>
                          </Col>
                        ))
                      }
                    </Row>
                  </>
                )) : (
                  <div className="text-center">
                    <span>No booked timings</span>
                  </div>
                )
              }
            </Col>
          </Row>
        </div>
      </Card>
      <BarTitleHome title="" />
      <Modal
        title="Select Time"
        visible={openSelectTime}
        width={400}
        onCancel={() => { setOpenSelectTime(false); }}
        onOk={handleBookStream}
        okText="Book Stream"
        okButtonProps={{ disabled: loading }}
        cancelButtonProps={{ disabled: loading }}
      >
        <Row>
          <Col lg={12} xs={24} md={12}>
            {
              items && items._id && (
                <TimePicker
                  disabledHours={disabledHours}
                  disabledMinutes={disabledTimeMinutes}
                  defaultValue={moment(items.startAt)}
                  value={timeSelected || ''}
                  placeholder="Select Start Time"
                  format="HH:mm"
                  onChange={(e) => setTimeSelected(moment(e))}
                  showNow={false}
                  allowClear={false}
                  style={{ width: '100%' }}
                />
              )
            }
          </Col>
          <Col lg={12} xs={24} md={12}>
            {
              items && items._id && (
                <TimePicker
                  style={{ width: '100%' }}
                  allowClear={false}
                  disabledHours={disabledHours}
                  disabledMinutes={disabledTimeMinutes}
                  defaultValue={moment(items.endAt)}
                  value={timeEndSelected || ''}
                  placeholder="Select End Time"
                  format="HH:mm"
                  onChange={(e) => setEndTimeSelected(moment(e))}
                  showNow={false}
                />
              )
            }
          </Col>
        </Row>
      </Modal>
    </div>
  );
}
const mapStates = (state) => ({
  user: state.user.current
});
const mapDispatch = {};
export default connect(mapStates, mapDispatch)(DateBookingStream);
