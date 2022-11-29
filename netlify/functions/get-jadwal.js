const fetch = require("node-fetch");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const main = async (npmReq, passwordReq) => {
  const baseUrl = "https://simkuliah.unsyiah.ac.id";

  const getCookie = () =>
    new Promise((resolve, reject) => {
      fetch(`${baseUrl}`)
        .then((res) => res.headers.raw()["set-cookie"][0].split("; ")[0])
        .then((resCookie) => resolve(resCookie))
        .catch((err) => reject(err));
    });

  const login = (npm, passwd, cookie) =>
    new Promise((resolve, reject) => {
      fetch(`${baseUrl}`, {
        method: "POST",
        body: `username=${npm}&password=${passwd}`,
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie: cookie,
        },
      })
        .then((res) => res.text())
        .then((resText) => resolve(resText))
        .catch((err) => reject(err));
    });

  const getJadwal = (cookie) =>
    new Promise((resolve, reject) => {
      fetch(`https://simkuliah.unsyiah.ac.id/index.php/jadwal_kuliah`, {
        headers: {
          cookie: cookie,
        },
      })
        .then((res) => res.text())
        .then((data) => {
          data = data
            .split("<tbody>")
            .toString()
            .split("</tbody>")[0]
            .toString()
            .split("</thead>")[1];
          let dataMK = [];
          data.split("</tr>").forEach((mk) => {
            const temp = mk.split("</td>").toString();
            let matkul = temp.split("<td>")[2];
            let dosen = temp.split('<span style="font-size: 10pt;">Nama : ')[1];
            let nip = temp.split('<span style="font-size: 10pt;">NIP : ')[1];
            let hp = temp.split(
              '<span style="font-size: 10pt;">Nomor HP : '
            )[1];
            let ruang = temp.split(
              '<span style="font-size: 10pt;">Ruang : '
            )[1];
            let hari = temp.split('<span style="font-size: 10pt;">')[4];
            let jam = temp.split('<span style="font-size: 10pt;">')[6];
            if (matkul !== undefined) {
              matkul = matkul.split(",")[0].replace("<br>", " ");
              dosen = dosen.split("<br></span>")[0];
              nip = nip.split("<br></span>")[0];
              hp = hp.split("<br></span>")[0];
              ruang = ruang.split("<br></span>")[0];
              hari = hari.split(",")[1].split(":")[1].split(",")[0].trim();
              jam = jam.split("&nbsp")[0].split(":")[1].trim().split(" - ")[0];
              dataMK.push({
                mk: matkul,
                dosen: dosen,
                nip: nip,
                hp: hp,
                ruang: ruang,
                hari: hari,
                jam: jam.replace(".", ":"),
              });
            }
          });
          resolve(dataMK);
        })
        .catch((err) => reject(err));
    });

  const cookie = await getCookie();
  const resLogin = await login(npmReq, passwordReq, cookie);
  try {
    const name = resLogin
      .split('User-Profile-Image">')[1]
      .split("</span>")[0]
      .replace("<span>", "")
      .trim();
    const jadwal = await getJadwal(cookie);
    return {
      success: true,
      name,
      mon: jadwal.filter((i) => i.hari === "Senin"),
      tue: jadwal.filter((i) => i.hari === "Selasa"),
      wed: jadwal.filter((i) => i.hari === "Rabu"),
      thu: jadwal.filter((i) => i.hari === "Kamis"),
      fri: jadwal.filter((i) => i.hari === "Jumat"),
      sat: jadwal.filter((i) => i.hari === "Sabtu"),
    };
  } catch (e) {
    return {
      success: false,
      msg: "Login failed",
    };
  }
};

exports.handler = async function (req) {
  if (req.body) {
    const { npm, password } = JSON.parse(req.body);
    const result = await main(npm, password);
    return {
      statusCode: 200,
      body: JSON.stringify({ npm, result }),
    };
  }
  return {
    statusCode: 401,
    body: JSON.stringify({ msg: "bad request" }),
  };
};
