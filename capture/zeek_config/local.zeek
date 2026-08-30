# Zeek configuration for real flow log generation
@load base/frameworks/notice
@load base/protocols/conn
@load base/protocols/http
@load base/protocols/dns

redef Log::default_rotation_interval = 0 sec;
redef Conn::default_extract = T;

event zeek_init() {
    print "Zeek Flow Monitoring Started for Network Attack Forecasting";
}
