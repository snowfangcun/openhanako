import 'package:flutter_test/flutter_test.dart';
import 'package:daoxing/main.dart';

void main() {
  testWidgets('App renders correctly', (WidgetTester tester) async {
    await tester.pumpWidget(const DaoXingApp());
    expect(find.text('修炼'), findsOneWidget);
  });
}
