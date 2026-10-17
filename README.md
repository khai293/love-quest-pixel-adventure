# Love Quest — Hành trình của chúng mình

Game phiêu lưu thiên nhiên pixel trên web, dành cho điện thoại và máy tính. Bốn chương dựa trên những kỷ niệm người dùng cung cấp, kết nối với chương quà ngày **20/10/2026** và chế độ dạo chơi tự do.

**Chơi trên GitHub Pages:** https://khai293.github.io/love-quest-pixel-adventure/

## Chạy tại máy

Không cần Node, npm, build, khóa API hay backend. Cần một máy chủ HTTP để trình duyệt tải ES modules và JSON:

```sh
cd /workspace/love-quest-pixel-adventure
python3 -m http.server 8000 --bind 127.0.0.1
```

Mở cổng 8000 trong trình duyệt khi phát triển ở máy của bạn. Không mở trực tiếp bằng `file://`.

Trên máy tính: WASD / phím mũi tên để đi, E để tương tác, C để đổi nhân vật, Esc để mở/đóng menu. Nhấp vào mặt đất để đi tới. Điện thoại có D-pad và nút tương tác cảm ứng; chơi được dọc và ngang. Nút **Đến địa điểm** giúp tìm ký ức đang mở.

## Những phần có thể chơi

| Chương | Hoạt động |
| --- | --- |
| Đêm định mệnh | Điều khiển chuyến xe đêm, ghép bó hoa |
| Những ngày đầu yêu nhau | Tìm đường đi làm, chọn tin nhắn quan tâm, đón nhau trở về |
| Buổi hẹn của năm người | Trao năm vé và xếp ghế phim, ghi nhớ món ăn, sắp xếp/chụp ảnh cả nhóm |
| Giận một chút, thương nhiều hơn | Khám phá hai phía cảm xúc, ghép lời nhắn, cùng bước lại gần và làm hòa |
| Món quà ngày 20/10 | Đặt lại bốn vật phẩm, tháo ruy-băng, mở thư và ảnh |

13 phần chơi, chương mở tuần tự, tự lưu sau từng phần. Có album, chơi lại chương, xuất/nhập tiến trình, chuyển nhân vật, ba khu vực khám phá, ba chế độ ánh sáng, nhạc nền và chất lượng đồ họa nhẹ.

Nhạc nền dùng đúng tệp **NƠI NÀY CÓ ANH - Instrumental.mp3** do người dùng cung cấp, được lưu tại `assets/audio/noi-nay-co-anh-instrumental.mp3` và phát lặp. Nhạc bắt đầu sau thao tác nhấn chơi/bật loa; không tự phát khi vừa tải trang. Có bật/tắt, chỉnh âm lượng ngay và ghi nhớ lựa chọn. Đổi chương hoặc quay lại tab không tua bài về đầu. Tắt tab/tạm rời cửa sổ sẽ tạm dừng; khi trở lại hành trình, bài tiếp tục. Âm lượng trên iOS có thể phụ thuộc nút âm lượng thiết bị.

Hai cháu và em trai 8 tuổi xuất hiện trong chương xem phim/ăn uống. Không có khu vui chơi hay gắp thú. Trò chơi mới không dùng cốt truyện hoặc cơ chế chiến đấu của Lumina Quest.

## Tùy chỉnh câu chuyện thật

Những lời tỏ tình, đoạn chat, tên địa điểm và bức thư thật **chưa được cung cấp**. Chỗ trống được đánh dấu; câu quan tâm trong mini-game là gợi ý tương tác, không được trình bày như bản ghi hội thoại có thật.

- `story/chapters.json`: tiền đề, thứ tự, các phần chơi, vật phẩm, mở/kết chương. Có thể thêm `expression` cho từng dòng: `happy`, `sad`, `surprised`, `shy`, `upset`, `joyful`.
- `story/dialogues.json`: dữ liệu hội thoại, các lựa chọn mẫu, các trường `personal` chờ điền.
- `story/characters.json`: đặc điểm nhân vật, chân dung và tên chờ bổ sung.
- `story/events.json`: các mốc mở khóa và vật phẩm.
- `story/quests.json`: mô tả mục tiêu và điều kiện hoàn thành.

Để cập nhật lời tỏ tình hiển thị cho **mọi người nhận đường link**, thay dòng chờ bổ sung trong `chapters.json` và xuất bản lại. Lời chúc/thư mặc định dùng `dialogues.json` → `personal.greeting.text` / `personal.letter.text`. Ảnh mặc định có thể khai báo bằng đường dẫn tương đối trong `personal.photos` (mảng), đặt ảnh trong `assets/` rồi xuất bản lại. Nội dung đưa vào repository công khai sẽ công khai cùng trang web.

Trình chỉnh sửa thư và thêm ảnh trong game chỉ lưu **riêng trong trình duyệt hiện tại**. Chúng không tự đi theo đường link sang máy của người nhận. Album cũng nói rõ giới hạn này. Không có dữ liệu nào được gửi lên máy chủ bởi game.

## Kiến trúc

```text
index.html                Giao diện và điểm vào ứng dụng
src/main.js               Vòng lặp, điều khiển, menu, tiến trình và tích hợp
src/world.js              Pixel renderer, camera, collision và sprite nhân vật
src/activities.js         13 phần chơi và hội thoại theo dữ liệu
src/story-engine.js       API timeline / điều kiện / sự kiện
src/storage.js            Lưu tiến trình và cài đặt tách biệt bản cũ
src/audio.js              Phát MP3 và hiệu ứng tương tác Web Audio
src/style.css             Giao diện responsive
src/activities.css        Giao diện mini-game
assets/key-art.png        Minh họa gốc cho màn hình chính
assets/portraits.png      12 chân dung, lưới 6 biểu cảm × 2 nhân vật
assets/audio/             Bản instrumental người dùng cung cấp
story/                    Dữ liệu nội dung
tests/test_game.py        Kiểm thử trình duyệt thực
archive/                  Hai game HTML gốc, sao lưu nguyên trạng
```

Renderer dùng sprite/terrain cache, culling, DPR tối đa 2, hạt giới hạn và camera mượt. Nhân vật có bốn hướng, idle/đi bộ. Ảnh minh họa và chân dung được tạo mới bằng `image_gen`; cảnh chơi và sprite được vẽ bằng Canvas. Đây không phải tài nguyên lấy từ game thương mại. Ba khu vực dùng chung cấu trúc bản đồ với bảng màu/thảm thực vật khác nhau.

API sự kiện cho nội dung tương lai:

```js
await window.loveQuest.story.run([
  {type: 'camera', x: 779, y: 569, zoom: 1.8, duration: 800},
  {type: 'wait', ms: 300},
  {type: 'camera', release: true},
]);
```

Timeline khóa điều khiển khi chạy, hỗ trợ `camera`, `wait`, `area`, `move`, `animation`, `fade`, `dialogue` và `flag`. Những nội dung chưa có không tự tạo thành sự kiện cá nhân.

Tiến trình dùng `lovequest.our-story.v1`, không ghi đè save game cũ. Ảnh/thư riêng tách khỏi tệp xuất tiến trình. Xóa dữ liệu trình duyệt sẽ xóa dữ liệu cục bộ; dùng xuất bản lưu để giữ tiến trình.

## Kiểm thử

Với Chromium hệ thống và Python Playwright:

```sh
python3 -m pip install -r requirements-dev.txt
python3 -m unittest discover -s tests -v
```

Chạy máy chủ ở cổng 8000 trước. Có thể đặt `CHROMIUM_PATH` hoặc `LOVEQUEST_TEST_URL` nếu cần. Bộ test dùng hồ sơ trình duyệt mới, không đụng bản lưu thật; đi qua đủ năm chương và 13 phần chơi bằng UI, tải lại giữa chương, chơi lại, xác nhận album/ảnh, thử bản lưu không hợp lệ, bàn phím, cảm ứng thật qua Chromium CDP, màn hình dọc/ngang.

`tests/test_audio.py` kiểm tra giải mã/phát đúng MP3, chạm để phát, bật/tắt và ghi nhớ tùy chọn, âm lượng tức thời, giữ vị trí khi mở chương, mô phỏng sự kiện đổi cửa sổ để kiểm tra tạm dừng/tiếp tục và phát lặp thật ở cuối bài (chạy nhanh 16 lần trong kiểm thử).

Mục tiêu là trải nghiệm mượt trên máy phổ thông; hiệu năng phụ thuộc thiết bị. Có tùy chọn giảm chi tiết và chuyển động. Mô phỏng cảm ứng đã được kiểm thử trên Chromium; cần thêm kiểm tra thực tế trên iPhone/Safari và các máy Android cụ thể.

## GitHub Pages

Các đường dẫn tài nguyên đều tương đối, hỗ trợ project site `/love-quest-pixel-adventure/`. `.nojekyll` giữ nguyên các tệp. Repository đã có liên kết Pages; dùng **Settings → Pages → Deploy from a branch → main → / (root)** khi cấu hình lại. Push các tệp này lên `main`, chờ đợt triển khai Pages hoàn tất rồi mở đường dẫn chơi ở đầu README.

Hai bản cũ được giữ nguyên trong `archive/love-quest-classic.html`, `archive/lumina-quest-classic.html`; `lumina-quest.html` gốc vẫn ở thư mục chính.
